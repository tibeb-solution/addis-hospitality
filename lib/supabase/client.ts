import {
  getCurrentUser,
  setCurrentUser,
  getUsers,
  saveUsers,
  getCompanyProfiles,
  saveCompanyProfiles,
  getEmployeeProfiles,
  saveEmployeeProfiles,
  getDocuments,
  saveDocuments,
} from "@/lib/local-storage";
import { createBrowserClient } from "@supabase/ssr";

const TABLE_KEY_MAP: Record<string, string> = {
  profiles: "ah_users",
  company_profiles: "ah_company_profiles",
  employee_profiles: "ah_employee_profiles",
  documents: "ah_documents",
};

function readTable(table: string) {
  const key = TABLE_KEY_MAP[table] ?? table;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function writeTable(table: string, rows: any[]) {
  const key = TABLE_KEY_MAP[table] ?? table;
  localStorage.setItem(key, JSON.stringify(rows));
}

function filterRows(
  rows: any[],
  filters: Array<{ field: string; value: any }>,
) {
  return rows.filter((row) =>
    filters.every((filter) => row[filter.field] === filter.value),
  );
}

function applyOrder(
  rows: any[],
  order: { column: string; ascending: boolean } | null,
) {
  if (!order) return rows;
  return [...rows].sort((a, b) => {
    const left = a[order.column];
    const right = b[order.column];

    if (left == null && right == null) return 0;
    if (left == null) return order.ascending ? 1 : -1;
    if (right == null) return order.ascending ? -1 : 1;
    if (left > right) return order.ascending ? 1 : -1;
    if (left < right) return order.ascending ? -1 : 1;
    return 0;
  });
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unable to read file"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function createQuery(table: string) {
  const filters: Array<{ field: string; value: any }> = [];
  let order: { column: string; ascending: boolean } | null = null;
  let limitCount: number | null = null;
  let countExact = false;
  let head = false;
  let single = false;
  let selectedColumns: string | null = null;
  let isInsert = false;
  let isUpdate = false;
  let isDelete = false;
  let insertRows: any = null;
  let updatePayload: any = null;

  const execute = async () => {
    const rows = readTable(table);
    const baseRows = filterRows(rows, filters);

    if (isInsert) {
      const insertArray = Array.isArray(insertRows) ? insertRows : [insertRows];
      const createdRows = insertArray.map((row: any) => ({
        ...row,
        id: row.id ?? Math.random().toString(36).substring(2, 11),
        created_at: row.created_at ?? new Date().toISOString(),
        uploaded_at:
          row.uploaded_at ?? row.created_at ?? new Date().toISOString(),
      }));
      const finalRows = [...rows, ...createdRows];
      writeTable(table, finalRows);
      const data = single ? (createdRows[0] ?? null) : createdRows;
      return { data };
    }

    if (isUpdate) {
      let updatedRows: any[] = [];
      const nextRows = rows.map((row: any) => {
        if (filters.every((filter) => row[filter.field] === filter.value)) {
          const updated = {
            ...row,
            ...updatePayload,
            updated_at: new Date().toISOString(),
          };
          updatedRows.push(updated);
          return updated;
        }

        return row;
      });
      writeTable(table, nextRows);
      const data = single ? (updatedRows[0] ?? null) : updatedRows;
      return { data };
    }

    if (isDelete) {
      const remaining = rows.filter(
        (row: any) =>
          !filters.every((filter) => row[filter.field] === filter.value),
      );
      writeTable(table, remaining);
      return { data: null };
    }

    let result = applyOrder(baseRows, order);
    if (limitCount !== null) {
      result = result.slice(0, limitCount);
    }

    if (head) {
      return { data: [], count: baseRows.length };
    }

    if (single) {
      return { data: result[0] ?? null };
    }

    return { data: result };
  };

  const query: any = {
    select(columns?: string, opts?: any) {
      selectedColumns = columns ?? null;
      if (opts?.count === "exact") countExact = true;
      if (opts?.head) head = true;
      return query;
    },
    eq(field: string, value: any) {
      filters.push({ field, value });
      return query;
    },
    order(column: string, opts?: any) {
      order = { column, ascending: opts?.ascending !== false };
      return query;
    },
    limit(count: number) {
      limitCount = count;
      return query;
    },
    single() {
      single = true;
      return query;
    },
    insert(rows: any) {
      isInsert = true;
      insertRows = rows;
      return query;
    },
    update(payload: any) {
      isUpdate = true;
      updatePayload = payload;
      return query;
    },
    delete() {
      isDelete = true;
      return query;
    },
    then(onFulfilled: any, onRejected: any) {
      return execute().then(onFulfilled, onRejected);
    },
    catch(onRejected: any) {
      return execute().catch(onRejected);
    },
  };

  return query;
}

function createLocalClient() {
  function auth() {
    return {
      async getUser() {
        return { data: { user: getCurrentUser() } };
      },
      async getSession() {
        return { data: { session: null } };
      },
      async exchangeCodeForSession(_code: string) {
        return { error: null };
      },
      async signOut() {
        return { error: null };
      },
      async resetPasswordForEmail(_email: string, _opts?: any) {
        return { error: null };
      },
      async updateUser(updates: any) {
        const user = getCurrentUser();
        if (!user) {
          return { data: { user: null } };
        }
        const updated = { ...user, ...updates };
        const allUsers = getUsers().map((u) =>
          u.id === user.id ? updated : u,
        );
        saveUsers(allUsers);
        setCurrentUser(updated);
        return { data: { user: updated } };
      },
    };
  }

  function from(table: string) {
    return createQuery(table);
  }

  function storage() {
    const FILES_KEY = "ah_files";

    async function upload(
      path: string,
      file: File,
      opts?: { upsert?: boolean },
    ) {
      const files = JSON.parse(localStorage.getItem(FILES_KEY) || "{}");
      const dataUrl = await toDataUrl(file);
      files[path] = {
        dataUrl,
        contentType: file.type,
        uploadedAt: new Date().toISOString(),
      };
      localStorage.setItem(FILES_KEY, JSON.stringify(files));
      return { error: null };
    }

    async function remove(paths: string[]) {
      const files = JSON.parse(localStorage.getItem(FILES_KEY) || "{}");
      paths.forEach((path) => delete files[path]);
      localStorage.setItem(FILES_KEY, JSON.stringify(files));
      return { error: null };
    }

    function getPublicUrl(path: string) {
      const files = JSON.parse(localStorage.getItem(FILES_KEY) || "{}");
      return { data: { publicUrl: files[path]?.dataUrl ?? "" } };
    }

    async function createSignedUrl(path: string, _expires: number) {
      const files = JSON.parse(localStorage.getItem(FILES_KEY) || "{}");
      return { data: { signedUrl: files[path]?.dataUrl ?? "" } };
    }

    return {
      from(_bucket: string) {
        return {
          upload,
          remove,
          getPublicUrl,
          createSignedUrl,
        };
      },
    };
  }

  return {
    auth: auth(),
    from,
    storage: storage(),
  };
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function isSupabaseConfigured() {
  return Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://katuecvwrvqhgoidqsea.supabase.co") &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

  );
}

export function createClient() {
  if (!isSupabaseConfigured()) return createLocalClient();

  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }

  return browserClient;
}
