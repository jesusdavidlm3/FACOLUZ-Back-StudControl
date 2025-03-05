export interface loginData{
    id: number,
    passwordHash: string
}

export interface createuserData{
    idType: number,
    id: number,
    name: string,
    lastname: string,
    passwordSHA256: string,
    userType: number,
    type: 0 | 1 | 2 | 3
}

export interface userData extends createuserData{
    active: boolean
}

export interface reactivateUser{
    id: number,
    newPassword: string
}

export interface clasesItem{
    section: string,
    asignature: string,
    userId: number,
    role: number
}

export interface asignData{
    section: string,
    asignature: string,
    userId: number,
    role: number
}