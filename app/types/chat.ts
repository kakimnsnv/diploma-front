export type Chat = {
    id: number
    status: string
    to: string
    icon: string
    original_image_url: string
    result_image_url: string
    updatedAt: string
    createdAt: string
}

export type UploadResponse = {
    job_id: string
}