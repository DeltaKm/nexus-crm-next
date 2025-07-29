import 'next'

declare module 'next' {
  export interface NextApiRequest {
    // Aggiungi qui eventuali estensioni personalizzate a NextApiRequest
  }
  
  export interface NextApiResponse {
    // Aggiungi qui eventuali estensioni personalizzate a NextApiResponse
  }
  
  // Sovrascrivi i tipi delle route dinamiche
  export interface NextApiRouteHandler<T = any> {
    (
      req: NextApiRequest,
      context: { params: Record<string, string | string[]> }
    ): T | Promise<T>
  }
}
