declare global {
  interface Chat {
    id: number;
    status: string;
    to: string;
    icon: string;
    input_nii_url: string;
    output_image_url: string;
    updated_at: string;
    created_at: string;
  }

  interface UploadResponse {
    job_id: string;
  }
}

export {};
