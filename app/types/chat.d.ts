declare global {
	interface Chat {
		id: number;
		name: string;
		status: string;
		to: string;
		icon: string;
		input_nii_url: string;
		output_image_url: string;
		error_message: string;
		updated_at: string;
		created_at: string;
	}

	interface UploadResponse {
		job_id: string;
	}
}

export {};
