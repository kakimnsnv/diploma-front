declare global {
	interface ClassificationResult {
		id: number;
		processing_job_id: number;
		predicted_class: number;
		predicted_class_name: string;
		confidence: number;
		class_probabilities: string;
		class_names: string;
		created_at: string;
		updated_at: string;
	}

	interface Chat {
		id: number;
		name: string;
		status: string;
		to: string;
		icon: string;
		input_nii_url: string;
		output_image_url: string;
		error_message: string;
		classification_result?: ClassificationResult;
		updated_at: string;
		created_at: string;
	}

	interface UploadResponse {
		job_id: string;
	}

	interface SlicesResponse {
		status: string;
		message: string;
		shape: number[];
		classes_detected: number[];
		total_slices: number;
		nifti_path: string | null;
		slices: string[];
	}
}

export {};
