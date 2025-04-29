import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { parse } from "papaparse";
import { CircleAlert, CloudUpload, FileSpreadsheet } from "lucide-react";

type FileDropzoneProps = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	onFileAccepted: (data: any[], headers: string[]) => void;
};

const FileDropzone = ({ onFileAccepted }: FileDropzoneProps) => {
	const onDrop = useCallback(
		(acceptedFiles: File[]) => {
			const file = acceptedFiles[0];
			if (file) {
				parse(file, {
					header: true,
					skipEmptyLines: true,
					complete: (results) => {
						const headers = results.meta.fields || [];
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						onFileAccepted(results.data as any[], headers);
					},
					error: (error) => {
						console.error("Error parsing CSV:", error);
					},
				});
			}
		},
		[onFileAccepted]
	);

	const {
		getRootProps,
		getInputProps,
		isDragActive,
		isDragAccept,
		isDragReject,
	} = useDropzone({
		onDrop,
		accept: {
			"text/csv": [".csv"],
			"application/vnd.ms-excel": [".csv"],
		},
		maxFiles: 1,
	});

	return (
		<div
			{...getRootProps()}
			className={`
        border-2 border-dashed bg-sidebar-accent rounded-lg p-8 text-center cursor-pointer transition-all duration-200
        flex flex-col items-center justify-center h-[40dvh]
        ${
					isDragActive
						? "border-blue-500 bg-blue-50"
						: "border-border hover:border-primary/20 "
				}
        ${isDragAccept ? "border-green-500 bg-green-50" : ""}
        ${isDragReject ? "border-red-500 bg-red-50" : ""}
      `}
		>
			<input {...getInputProps()} />

			<div className="mb-4 text-5xl">
				{isDragReject ? (
					<CircleAlert className="mx-auto text-red-500" />
				) : (
					<CloudUpload
						className={`mx-auto ${
							isDragActive ? "text-blue-500" : "text-gray-400"
						}`}
					/>
				)}
			</div>

			{isDragReject ? (
				<p className="text-red-500 font-medium">Only CSV files are accepted</p>
			) : isDragActive ? (
				<p className="text-blue-500 font-medium">Drop the CSV file here</p>
			) : (
				<>
					<p className="text-gray-700 font-medium mb-2">
						Drag & drop your CSV file here
					</p>
					<p className="text-gray-500 text-sm mb-4">or click to browse files</p>
					<div className="flex items-center justify-center gap-2 text-sm text-gray-500">
						<FileSpreadsheet /> Only CSV files are supported
					</div>
				</>
			)}
		</div>
	);
};

export default FileDropzone;
