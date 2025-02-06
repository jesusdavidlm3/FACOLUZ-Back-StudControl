export interface loginData{
    identification: string,
    passwordHash: string
}

export interface createuserData{
    idType: number,
    idNumber: string,
    name: string,
    lastname: string,
    password: string,
    userType: number
}

export interface reactivateUser{
    id: string,
    newPassword: string
}

export interface clasesItem{
    section: string,
    asignature: string,
    userId: string,
    role: number
}

export interface asignData{
    section: string,
    asignature: string,
    userId: string,
    role: number
}