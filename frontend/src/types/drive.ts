export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size: number
  modifiedTime: string
  iconLink?: string
  thumbnailLink?: string
  webViewLink?: string
  parents?: string[]
  dimensions?: string | null
  starred?: boolean
  accountEmail: string
  accountId: string
}

export interface ConnectedAccount {
  googleAccountId: string
  email: string
  name: string
  storage?: {
    limit: number
    usage: number
  } | null
}

export interface StorageInfo {
  totalLimit: number
  totalUsage: number
}

export type SidebarTab = 'all' | 'favorites' | 'recent'

export type ViewMode = 'grid' | 'list'

export interface BreadcrumbItem {
  id: string
  name: string
}
