
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateCSVData = (data: any[]): boolean => {
	if (!data || data.length === 0) {
		return false;
	}

	const requiredFields = ["name", "email", "phone"]; // Example required fields
	const headers = Object.keys(data[0]);

	for (const field of requiredFields) {
		if (!headers.includes(field)) {
			return false;
		}
	}

	return true;
};

export const validateEmailFormat = (email: string): boolean => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
	const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
	return phoneRegex.test(phone);
};
