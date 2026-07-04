
export type Term = {
  id?: string,
  AY: string,
  semester: string,
  isActive : boolean,
}

export type Organization = {
  id?: string,
  name: string,
  shortName: string,
  isArchived: boolean,
  subscribed: boolean,
  users?: string[],
  facultyId?: string,
  programId?: string,
  accessLevel: number,
  orgLogoUrl?: string
}