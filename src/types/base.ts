export type BaseType =
  | 'airfield'
  | 'naval'
  | 'barracks'
  | 'military'
  | 'range'
  | 'nuclear'
  | 'bunker'

export type Branch =
  | 'US Air Force'
  | 'US Army'
  | 'US Navy'
  | 'US Marine Corps'
  | 'US Space Force'
  | 'Joint'
  | 'NATO'
  | 'Allied'

export type OperationalStatus = 'active' | 'limited' | 'inactive' | 'classified'

export type DataSource = 'osint' | 'sigint' | 'geoint' | 'humint'

export interface MilitaryBase {
  id: string
  name: string
  country: string
  countryCode: string
  lat: number
  lng: number
  type: BaseType
  branch: Branch
  status: OperationalStatus
  personnel: number
  description: string
  established: string
  region: string
}
