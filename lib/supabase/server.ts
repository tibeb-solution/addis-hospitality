// Server-side mock: provide an interface similar to supabase server client.
export async function createClient() {
  return {
    async auth() {
      return {
        async getUser() {
          return { data: { user: null } };
        },
      };
    },
    from() {
      return {
        async select() {
          return { data: [] };
        },
      };
    },
  };
}
