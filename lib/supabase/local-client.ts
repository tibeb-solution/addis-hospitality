type AnyRecord = Record<string, any>

type QueryBuilder = {
  select: (...args: any[]) => QueryBuilder
  eq: (column: string, value: any) => QueryBuilder
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder
  limit: (count: number) => QueryBuilder
  single: () => Promise<{ data: any; error: null | { message: string } }>
  maybeSingle: () => Promise<{ data: any; error: null | { message: string } }>
  insert: (rows: AnyRecord[]) => QueryBuilder
  update: (values: AnyRecord) => QueryBuilder
  delete: () => QueryBuilder
  then: (resolve: (value: { data: any; error: null | { message: string } }) => unknown, reject?: (reason?: unknown) => unknown) => Promise<unknown>
  catch: (reject: (reason?: unknown) => unknown) => Promise<unknown>
}

type AuthClient = {
  signInWithPassword: (credentials: { email: string; password: string }) => Promise<{ data?: { user?: AnyRecord }; error: null | { message: string } }>
  signUp: (payload: { email: string; password: string; options?: { emailRedirectTo?: string; data?: AnyRecord } }) => Promise<{ data?: { user?: AnyRecord; session?: AnyRecord }; error: null | { message: string } }>
  getUser: () => Promise<{ data: { user: AnyRecord | null }; error: null | { message: string } }>
  getSession: () => Promise<{ data: { session: AnyRecord | null }; error: null | { message: string } }>
  resetPasswordForEmail: (email: string, options?: AnyRecord) => Promise<{ data: AnyRecord; error: null | { message: string } }>
  updateUser: (payload: { password?: string; data?: AnyRecord }) => Promise<{ data: { user: AnyRecord | null }; error: null | { message: string } }>
  signOut: () => Promise<{ error: null | { message: string } }>
  exchangeCodeForSession: (code: string) => Promise<{ data: { session: AnyRecord | null }; error: null | { message: string } }>
}

type StorageClient = {
  from: (bucket: string) => {
    upload: (path: string, file: File | Blob, options?: AnyRecord) => Promise<{ data: { path: string } | null; error: null | { message: string } }>
    remove: (paths: string[]) => Promise<{ data: { path: string }[] | null; error: null | { message: string } }>
    getPublicUrl: (path: string) => { publicUrl: string }
  }
}

const STORAGE_KEY = 'addis-hospitality-local-db'
let memoryState: AnyRecord | null = null

function createSeedState(): AnyRecord {
  const now = new Date().toISOString()
  return {
    users: [
      {
        id: 'demo-admin-1',
        email: 'admin@example.com',
        password: 'Admin1234!',
        created_at: now,
        user_metadata: { role: 'admin', full_name: 'System Admin' },
      },
      {
        id: 'demo-company-1',
        email: 'company@example.com',
        password: 'Company1234!',
        created_at: now,
        user_metadata: { role: 'company', full_name: 'Demo Company' },
      },
      {
        id: 'demo-employee-1',
        email: 'employee@example.com',
        password: 'Employee1234!',
        created_at: now,
        user_metadata: { role: 'employee', full_name: 'Demo Employee' },
      },
    ],
    session: null,
    tables: {
      profiles: [
        { id: 'demo-admin-1', email: 'admin@example.com', role: 'admin', status: 'active', created_at: now },
        { id: 'demo-company-1', email: 'company@example.com', role: 'company', status: 'active', created_at: now },
        { id: 'demo-employee-1', email: 'employee@example.com', role: 'employee', status: 'active', created_at: now },
      ],
      employee_profiles: [
        { id: 'demo-employee-1', avatar_url: null, bio: 'Demo employee profile', phone: '+251911000000', created_at: now },
      ],
      company_profiles: [
        { id: 'demo-company-1', company_name: 'Demo Hospitality Co.', business_type: 'hotel', created_at: now },
      ],
      documents: [],
      avatars: [],
    },
  }
}

function readState(): AnyRecord {
  if (typeof window !== 'undefined') {
    const existing = window.localStorage.getItem(STORAGE_KEY)
    if (existing) {
      try {
        return JSON.parse(existing)
      } catch {
        // Ignore malformed data and fall back to seeded state.
      }
    }
    const seeded = createSeedState()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
    return seeded
  }

  if (!memoryState) {
    memoryState = createSeedState()
  }

  return memoryState
}

function writeState(state: AnyRecord) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return
  }

  memoryState = state
}

function createId(prefix = 'item') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function buildQuery(table: string): QueryBuilder {
  const state = readState()
  const filters: Array<(item: AnyRecord) => boolean> = []
  let orderBy: { column: string; ascending: boolean } | null = null
  let limitCount: number | null = null
  let pendingInsertRows: AnyRecord[] | null = null
  let pendingValues: AnyRecord | null = null
  let pendingDelete = false
  let pendingUpdate = false

  const execute = async () => {
    const currentState = readState()
    const rows = clone(currentState.tables[table] ?? []) as AnyRecord[]

    if (pendingInsertRows) {
      return { data: pendingInsertRows[0] ?? null, error: null }
    }

    const filtered = rows.filter((item) => filters.every((filter) => filter(item)))
    const ordered = filtered.slice().sort((a, b) => {
      if (!orderBy) return 0
      const left = a[orderBy.column]
      const right = b[orderBy.column]
      const result = left > right ? 1 : left < right ? -1 : 0
      return orderBy.ascending ? result : -result
    })
    const limited = limitCount === null ? ordered : ordered.slice(0, limitCount)

    if (pendingUpdate) {
      const updatedRows = (currentState.tables[table] ?? []).map((item: AnyRecord) => {
        if (filters.every((filter) => filter(item))) {
          return { ...item, ...pendingValues }
        }
        return item
      })
      currentState.tables[table] = updatedRows
      writeState(currentState)
      return { data: updatedRows.filter((item) => filters.every((filter) => filter(item))), error: null }
    }

    if (pendingDelete) {
      currentState.tables[table] = (currentState.tables[table] ?? []).filter((item: AnyRecord) => !filters.every((filter) => filter(item)))
      writeState(currentState)
      return { data: [], error: null }
    }

    return { data: limited, error: null }
  }

  const builder: QueryBuilder = {
    select: () => builder,
    eq: (column, value) => {
      filters.push((item) => item[column] === value)
      return builder
    },
    order: (column, options) => {
      orderBy = { column, ascending: options?.ascending ?? true }
      return builder
    },
    limit: (count) => {
      limitCount = count
      return builder
    },
    single: async () => {
      const response = await execute()
      return { data: Array.isArray(response.data) ? response.data[0] ?? null : response.data, error: null }
    },
    maybeSingle: async () => {
      const response = await execute()
      return { data: Array.isArray(response.data) ? response.data[0] ?? null : response.data, error: null }
    },
    insert: (rows) => {
      const createdRows = rows.map((item) => ({
        id: item.id ?? createId(table),
        created_at: item.created_at ?? new Date().toISOString(),
        ...item,
      }))
      const currentState = readState()
      currentState.tables[table] = [...(currentState.tables[table] ?? []), ...createdRows]
      writeState(currentState)
      pendingInsertRows = createdRows
      return builder
    },
    update: (values) => {
      pendingValues = values
      pendingUpdate = true
      return builder
    },
    delete: () => {
      pendingDelete = true
      return builder
    },
    then: (resolve) => execute().then(resolve),
    catch: (reject) => execute().catch(reject),
  }

  return builder
}

function createStorageClient(): StorageClient {
  return {
    from: (bucket: string) => ({
      upload: async (path: string, file: File | Blob, _options?: AnyRecord) => {
        const state = readState()
        const storageEntries = clone(state.tables.avatars ?? []) as AnyRecord[]
        let content = ''

        if (typeof FileReader !== 'undefined' && file instanceof File) {
          content = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(new Error('Unable to read file'))
            reader.readAsDataURL(file)
          })
        } else if (typeof Blob !== 'undefined' && file instanceof Blob) {
          content = await file.text().catch(() => '')
        }

        const entry = {
          id: createId(bucket),
          bucket,
          path,
          content,
          created_at: new Date().toISOString(),
        }

        state.tables.avatars = [...storageEntries, entry]
        writeState(state)
        return { data: { path }, error: null }
      },
      remove: async (paths: string[]) => {
        const state = readState()
        state.tables.avatars = (state.tables.avatars ?? []).filter((entry: AnyRecord) => !paths.includes(entry.path))
        writeState(state)
        return { data: paths.map((path) => ({ path })), error: null }
      },
      getPublicUrl: (path: string) => {
        const state = readState()
        const entry = (state.tables.avatars ?? []).find((item: AnyRecord) => item.path === path)
        if (entry?.content) {
          return { publicUrl: entry.content }
        }
        return { publicUrl: `/uploads/${path}` }
      },
    }),
  }
}

export function createClient() {
  const auth: AuthClient = {
    signInWithPassword: async ({ email, password }) => {
      const currentState = readState()
      const user = currentState.users.find((entry: AnyRecord) => entry.email?.toLowerCase() === email.toLowerCase() && entry.password === password)

      if (!user) {
        return { error: { message: 'Invalid email or password' } }
      }

      currentState.session = {
        access_token: `local-${user.id}`,
        refresh_token: `local-${user.id}`,
        expires_at: Date.now() + 60 * 60 * 1000,
        user: {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata ?? {},
          app_metadata: { role: user.user_metadata?.role ?? 'employee' },
        },
      }

      writeState(currentState)
      return { data: { user: currentState.session.user }, error: null }
    },

    signUp: async ({ email, password, options }) => {
      const currentState = readState()
      const existingUser = currentState.users.find((entry: AnyRecord) => entry.email?.toLowerCase() === email.toLowerCase())
      if (existingUser) {
        return { error: { message: 'An account with that email already exists' } }
      }

      const role = options?.data?.role ?? 'employee'
      const userId = createId(role)
      const userRecord = {
        id: userId,
        email,
        password,
        created_at: new Date().toISOString(),
        user_metadata: {
          role,
          ...(options?.data ?? {}),
        },
      }

      currentState.users.push(userRecord)
      currentState.tables.profiles.push({
        id: userId,
        email,
        role,
        status: 'active',
        created_at: userRecord.created_at,
      })

      if (role === 'company') {
        currentState.tables.company_profiles.push({
          id: userId,
          company_name: options?.data?.company_name ?? '',
          business_type: options?.data?.business_type ?? '',
          created_at: userRecord.created_at,
        })
      } else {
        currentState.tables.employee_profiles.push({
          id: userId,
          avatar_url: null,
          bio: '',
          phone: options?.data?.phone ?? '',
          created_at: userRecord.created_at,
        })
      }

      currentState.session = {
        access_token: `local-${userId}`,
        refresh_token: `local-${userId}`,
        expires_at: Date.now() + 60 * 60 * 1000,
        user: {
          id: userId,
          email,
          user_metadata: userRecord.user_metadata,
          app_metadata: { role },
        },
      }

      writeState(currentState)
      return { data: { user: currentState.session.user, session: currentState.session }, error: null }
    },

    getUser: async () => {
      const currentState = readState()
      return { data: { user: currentState.session?.user ?? null }, error: null }
    },

    getSession: async () => {
      const currentState = readState()
      return { data: { session: currentState.session ?? null }, error: null }
    },

    resetPasswordForEmail: async () => ({ data: {}, error: null }),

    updateUser: async ({ data }) => {
      const currentState = readState()
      if (!currentState.session?.user?.id) {
        return { data: { user: null }, error: null }
      }

      const user = currentState.users.find((entry: AnyRecord) => entry.id === currentState.session.user.id)
      if (user) {
        user.user_metadata = {
          ...user.user_metadata,
          ...(data ?? {}),
        }
        currentState.session.user.user_metadata = user.user_metadata
      }

      writeState(currentState)
      return { data: { user: currentState.session.user }, error: null }
    },

    signOut: async () => {
      const currentState = readState()
      currentState.session = null
      writeState(currentState)
      return { error: null }
    },

    exchangeCodeForSession: async () => ({ data: { session: null }, error: null }),
  }

  return {
    auth,
    storage: createStorageClient(),
    from: (table: string) => buildQuery(table),
  }
}

export type LocalSupabaseClient = ReturnType<typeof createClient>
