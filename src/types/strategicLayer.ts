export interface StrategicLayerMeta {
  id: string
  label: string
  featureCount: number
}

export interface StrategicFeatureData {
  layerId: string
  name: string
  country: string
  category: string
  subcategory: string
  status: string
  description: string
  properties: Record<string, unknown>
}

export interface StrategicLayerCSVData {
  id: string
  columns: string[]
  rows: Record<string, string | number | null>[]
}
