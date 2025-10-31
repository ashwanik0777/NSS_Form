"use client"

import type { StepProps } from "@/lib/types"
import { useState, useEffect } from "react"

// GBU Schools and their departments
const schoolDepartmentData = [
	{
		name: "School of Information & Communication Technology (SOICT)",
		departments: [
			"Computer Science & Engineering",
			"Information Technology",
			"Electronics & Communication Engineering",
		],
	},
	{
		name: "School of Engineering (SOE)",
		departments: [
			"Civil Engineering",
			"Mechanical Engineering",
			"Electrical Engineering",
			"Chemical Engineering",
		],
	},
	{
		name: "School of Management (SOM)",
		departments: [
			"Master of Business Administration",
			"Bachelor of Business Administration",
			"Commerce",
			"Economics",
		],
	},
	{
		name: "School of Humanities & Social Sciences (SOHSS)",
		departments: [
			"English",
			"Hindi",
			"Psychology",
			"Political Science",
			"Sociology",
			"History",
			"Education",
			"Forensic science",
		],
	},
	{
		name: "School of Law (SOL)",
		departments: [
			"Bachelor of Laws (LLB)",
			"Master of Laws (LLM)",
			"Bachelor of Arts + Bachelor of Laws (BA LLB)",
		],
	},
	{
		name: "School of Education (SOEd)",
		departments: ["Bachelor of Education (B.Ed)", "Master of Education (M.Ed)", "Diploma in Education"],
	},
	{
		name: "School of Biotechnology (SOB)",
		departments: ["Biotechnology", "Bioinformatics", "Microbiology", "Biochemistry"],
	},
	{
		name: "School of Vocational Studies & Skill Development (SOVSSD)",
		departments: ["Fashion Design", "Interior Design", "Hospitality Management", "Tourism Management"],
	},
]

export default function Step2PersonalDetails({
	formData,
	setFormData,
	errors,
	setErrors,
	onNext,
	onPrevious,
}: StepProps) {
	const [uploading, setUploading] = useState<{ [key: string]: boolean }>({})
	const [uploadError, setUploadError] = useState<{ [key: string]: string }>({})
	const [emailVerificationSent, setEmailVerificationSent] = useState(false)
	const [isEmailVerified, setIsEmailVerified] = useState(false)
	const [verificationCode, setVerificationCode] = useState("")
	const [verifyingEmail, setVerifyingEmail] = useState(false)

	const handleInputChange = (field: string, value: string) => {
		setFormData({ ...formData, [field]: value })
		if (errors[field]) {
			setErrors({ ...errors, [field]: "" })
		}

		// Reset email verification if email changes
		if (field === "emailId") {
			setEmailVerificationSent(false)
			setIsEmailVerified(false)
			setVerificationCode("")
		}
	}

	const handleSchoolChange = (schoolName: string) => {
		// Clear department when school changes
		setFormData({
			...formData,
			schoolName: schoolName,
			departmentName: "",
		})

		// Clear errors
		if (errors.schoolName) {
			setErrors({ ...errors, schoolName: "", departmentName: "" })
		}
	}

	const getAvailableDepartments = () => {
		const selectedSchool = schoolDepartmentData.find((school) => school.name === formData.schoolName)
		return selectedSchool ? selectedSchool.departments : []
	}

	const sendEmailVerification = async () => {
		if (!formData.emailId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId)) {
			setErrors({ ...errors, emailId: "Please enter a valid email address first" })
			return
		}

		setVerifyingEmail(true)
		try {
			const response = await fetch("/api/send-verification", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email: formData.emailId }),
			})

			const result = await response.json()

			if (result.success) {
				setEmailVerificationSent(true)
				alert("Verification code sent to your email!")
			} else {
				setErrors({ ...errors, emailId: result.message || "Failed to send verification code" })
			}
		} catch (error) {
			console.error("Email verification error:", error)
			setErrors({ ...errors, emailId: "Failed to send verification code" })
		} finally {
			setVerifyingEmail(false)
		}
	}

	// Persist email verification status in localStorage
	useEffect(() => {
		const verifiedEmail = localStorage.getItem("nss_verified_email")
		if (verifiedEmail && verifiedEmail === formData.emailId) {
			setIsEmailVerified(true)
		}
	}, [formData.emailId])

	const verifyEmailCode = async () => {
		if (!verificationCode.trim()) {
			alert("Please enter the verification code")
			return
		}

		setVerifyingEmail(true)
		try {
			const response = await fetch("/api/verify-email", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: formData.emailId,
					code: verificationCode,
				}),
			})

			const result = await response.json()

			if (result.success) {
				setIsEmailVerified(true)
				localStorage.setItem("nss_verified_email", formData.emailId)
				alert("Email verified successfully!")
			} else {
				alert(result.message || "Invalid verification code")
			}
		} catch (error) {
			console.error("Email verification error:", error)
			alert("Failed to verify email")
		} finally {
			setVerifyingEmail(false)
		}
	}

	const handleFileChange = async (field: string, file: File | null) => {
		setUploadError((prev) => ({ ...prev, [field]: "" }))
		if (!file) {
			setFormData({ ...formData, [field]: null })
			return
		}

		// Validate file size (max 2MB)
		if (file.size > 2 * 1024 * 1024) {
			setUploadError((prev) => ({ ...prev, [field]: "File size must be less than 2MB" }))
			return
		}

		setUploading((prev) => ({ ...prev, [field]: true }))
		try {
			const data = new FormData()
			data.append("file", file)
			const res = await fetch("/api/upload/cloudinary", {
				method: "POST",
				body: data,
			})
			const result = await res.json()
			console.log(`Upload result for ${field}:`, result)

			if (result.success && result.url) {
				setFormData({ ...formData, [field]: result.url })
				console.log(`${field} uploaded successfully:`, result.url)
			} else {
				setUploadError((prev) => ({ ...prev, [field]: result.message || "Upload failed" }))
			}
		} catch (e) {
			console.error(`Upload error for ${field}:`, e)
			setUploadError((prev) => ({ ...prev, [field]: "Upload failed" }))
		} finally {
			setUploading((prev) => ({ ...prev, [field]: false }))
		}

		if (errors[field]) {
			setErrors({ ...errors, [field]: "" })
		}
	}

	const handleNext = () => {
		const stepErrors: any = {}

		if (!formData.nameEnglish.trim()) {
			stepErrors.nameEnglish = "Name in English is required"
		}
		if (!formData.fatherName.trim()) {
			stepErrors.fatherName = "Father's name is required"
		}
		if (!formData.motherName.trim()) {
			stepErrors.motherName = "Mother's name is required"
		}
		if (!formData.dateOfBirth) {
			stepErrors.dateOfBirth = "Date of birth is required"
		}
		if (!formData.mobileNo.trim()) {
			stepErrors.mobileNo = "Mobile number is required"
		} else if (!/^[6-9]\d{9}$/.test(formData.mobileNo)) {
			stepErrors.mobileNo = "Please enter a valid 10-digit mobile number"
		}
		if (!formData.emailId.trim()) {
			stepErrors.emailId = "Email ID is required"
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId)) {
			stepErrors.emailId = "Please enter a valid email address"
		} else if (!isEmailVerified) {
			stepErrors.emailId = "Please verify your email address"
		}
		if (!formData.schoolName.trim()) {
			stepErrors.schoolName = "School is required"
		}
		if (!formData.departmentName.trim()) {
			stepErrors.departmentName = "Department name is required"
		}
		if (!formData.gender) {
			stepErrors.gender = "Gender is required"
		}
		if (!formData.category) {
			stepErrors.category = "Category is required"
		}
		if (!formData.institutionalIdCard.trim()) {
			stepErrors.institutionalIdCard = "Institutional I-Card number is required"
		}
		if (!formData.photo) {
			stepErrors.photo = "Student photo is required"
		}
		if (!formData.signature) {
			stepErrors.signature = "Student signature is required"
		}
		if (!formData.addressType) {
			stepErrors.addressType = "Please select Hostler or Day Scholar"
		}
		if (formData.addressType === "hostler" && !(formData.hostelAddress?.trim() ?? "")) {
			stepErrors.hostelAddress = "Hostel address is required"
		}
		if (formData.addressType === "dayscholar" && !(formData.homeAddress?.trim() ?? "")) {
			stepErrors.homeAddress = "Home address is required"
		}
		if (!formData.classSemester.trim()) {
			stepErrors.classSemester = "Class/Semester is required"
		}
		if (!formData.bloodGroup) {
			stepErrors.bloodGroup = "Blood group is required"
		}
		if (!formData.courseName.trim()) {
			stepErrors.courseName = "Course name is required"
		}

		if (Object.keys(stepErrors).length > 0) {
			setErrors({ ...errors, ...stepErrors })
			return
		}

		console.log("Step 2 form data before next:", formData)
		onNext()
	}

	return (
		<div className="nss-form-section">
			<div className="flex items-center mb-6">
				<div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mr-4">
					<svg
						className="w-8 h-8 text-primary"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
						/>
					</svg>
				</div>
				<div>
					<h2 className="text-2xl font-bold text-foreground">Personal Details</h2>
					<p className="text-muted-foreground">व्यक्तिगत विवरण</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="nss-form-group md:col-span-2">
					<label className="nss-form-label">
						Student Photo / छात्र की फोटो{" "}
						<span className="text-destructive">*</span>
					</label>
					<input
						type="file"
						className={`nss-form-input ${
							errors.photo ? "border-destructive" : ""
						}`}
						accept=".jpg,.jpeg,.png"
						onChange={(e) =>
							handleFileChange("photo", e.target.files?.[0] || null)
						}
						disabled={uploading.photo}
					/>
					{uploading.photo && (
						<p className="text-xs text-muted-foreground">Uploading...</p>
					)}
					{uploadError.photo && (
						<p className="text-xs text-destructive">{uploadError.photo}</p>
					)}
					{errors.photo && <p className="text-sm text-destructive">{errors.photo}</p>}
					{formData.photo && (
						<div className="mt-2">
							<p className="text-xs text-green-600">
								✓ Photo uploaded successfully
							</p>
							<img
								src={formData.photo}
								alt="Uploaded photo"
								className="mt-1 w-20 h-20 object-cover rounded"
							/>
						</div>
					)}
					<p className="text-xs text-muted-foreground mt-1">
						Upload passport size photo (JPG/PNG format, max 2MB)
					</p>
				</div>

				<div className="nss-form-group md:col-span-2">
					<label className="nss-form-label">
						Student Signature / छात्र के हस्ताक्षर{" "}
						<span className="text-destructive">*</span>
					</label>
					<input
						type="file"
						className={`nss-form-input ${
							errors.signature ? "border-destructive" : ""
						}`}
						accept=".jpg,.jpeg,.png"
						onChange={(e) =>
							handleFileChange("signature", e.target.files?.[0] || null)
						}
						disabled={uploading.signature}
					/>
					{uploading.signature && (
						<p className="text-xs text-muted-foreground">Uploading...</p>
					)}
					{uploadError.signature && (
						<p className="text-xs text-destructive">{uploadError.signature}</p>
					)}
					{errors.signature && <p className="text-sm text-destructive">{errors.signature}</p>}
					{formData.signature && (
						<div className="mt-2">
							<p className="text-xs text-green-600">
								✓ Signature uploaded successfully
							</p>
							<img
								src={formData.signature}
								alt="Uploaded signature"
								className="mt-1 w-32 h-16 object-cover rounded"
							/>
						</div>
					)}
					<p className="text-xs text-muted-foreground mt-1">
						Upload your signature (JPG/PNG format, max 2MB)
					</p>
				</div>

				<div className="nss-form-group">
					<label className="nss-form-label">
						Name (Capital Letters) / नाम (बड़े अक्षरों में){" "}
						<span className="text-destructive">*</span>
					</label>
					<input
						type="text"
						className={`nss-form-input ${
							errors.nameEnglish ? "border-destructive" : ""
						}`}
						value={formData.nameEnglish}
						onChange={(e) =>
							handleInputChange("nameEnglish", e.target.value.toUpperCase())
						}
						placeholder="ENTER NAME IN CAPITAL LETTERS"
						style={{ textTransform: "uppercase" }}
					/>
					{errors.nameEnglish && (
						<p className="text-sm text-destructive">{errors.nameEnglish}</p>
					)}
				</div>

				<div className="nss-form-group">
					<label className="nss-form-label">
						Father's Name / पिता का नाम{" "}
						<span className="text-destructive">*</span>
					</label>
					<input
						type="text"
						className={`nss-form-input ${
							errors.fatherName ? "border-destructive" : ""
						}`}
						value={formData.fatherName}
						onChange={(e) => handleInputChange("fatherName", e.target.value)}
						placeholder="Enter father's name"
					/>
					{errors.fatherName && (
						<p className="text-sm text-destructive">{errors.fatherName}</p>
					)}
				</div>

				<div className="nss-form-group">
					<label className="nss-form-label">
						Mother's Name / माता का नाम{" "}
						<span className="text-destructive">*</span>
					</label>
					<input
						type="text"
						className={`nss-form-input ${
							errors.motherName ? "border-destructive" : ""
						}`}
						value={formData.motherName}
						onChange={(e) => handleInputChange("motherName", e.target.value)}
						placeholder="Enter mother's name"
					/>
					{errors.motherName && (
						<p className="text-sm text-destructive">{errors.motherName}</p>
					)}
				</div>

				<div className="nss-form-group">
					<label className="nss-form-label">
						Date of Birth / जन्मतिथि (DD/MM/YYYY){" "}
						<span className="text-destructive">*</span>
					</label>
					<input
						type="date"
						className={`nss-form-input ${
							errors.dateOfBirth ? "border-destructive" : ""
						}`}
						value={formData.dateOfBirth}
						onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
					/>
					{errors.dateOfBirth && (
						<p className="text-sm text-destructive">{errors.dateOfBirth}</p>
					)}
					
				</div>

				<div className="nss-form-group">
					<label className="nss-form-label">
						Mobile Number / मोबाइल नंबर{" "}
						<span className="text-destructive">*</span>
					</label>
					<input
						type="tel"
						className={`nss-form-input ${
							errors.mobileNo ? "border-destructive" : ""
						}`}
						value={formData.mobileNo}
						onChange={(e) =>
							handleInputChange("mobileNo", e.target.value.replace(/\D/g, "").slice(0, 10))
						}
						placeholder="Enter 10-digit mobile number"
						maxLength={10}
					/>
					{errors.mobileNo && (
						<p className="text-sm text-destructive">{errors.mobileNo}</p>
					)}
				</div>

				<div className="nss-form-group md:col-span-2">
					<label className="nss-form-label">
						Email ID / ई-मेल आईडी{" "}
						<span className="text-destructive">*</span>
					</label>
					<div className="space-y-2">
						<div className="flex gap-2">
							<input
								type="email"
								className={`nss-form-input flex-1 ${
									errors.emailId ? "border-destructive" : ""
								}`}
								value={formData.emailId}
								onChange={(e) => handleInputChange("emailId", e.target.value.toLowerCase())}
								placeholder="Enter email address"
								disabled={isEmailVerified}
							/>
							{!isEmailVerified && (
								<button
									type="button"
									onClick={sendEmailVerification}
									disabled={verifyingEmail || !formData.emailId}
									className="nss-button-secondary whitespace-nowrap"
								>
									{verifyingEmail ? "Sending..." : "Send Code"}
								</button>
							)}
							{isEmailVerified && (
								<div className="flex items-center px-3 py-2 bg-green-100 text-green-800 rounded-md">
									<svg
										className="w-4 h-4 mr-1"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M5 13l4 4L19 7"
										/>
									</svg>
									Verified
								</div>
							)}
						</div>

						{emailVerificationSent && !isEmailVerified && (
							<div className="flex gap-2">
								<input
									type="text"
									className="nss-form-input flex-1"
									value={verificationCode}
									onChange={(e) => setVerificationCode(e.target.value)}
									placeholder="Enter verification code"
									maxLength={6}
								/>
								<button
									type="button"
									onClick={verifyEmailCode}
									disabled={verifyingEmail || !verificationCode}
									className="nss-button-primary whitespace-nowrap"
								>
									{verifyingEmail ? "Verifying..." : "Verify"}
								</button>
							</div>
						)}
					</div>
					{errors.emailId && <p className="text-sm text-destructive">{errors.emailId}</p>}
				</div>

				<div className="nss-form-group">
					<label className="nss-form-label">
						School / स्कूल{" "}
						<span className="text-destructive">*</span>
					</label>
					<select
						className={`nss-form-select ${
							errors.schoolName ? "border-destructive" : ""
						}`}
						value={formData.schoolName}
						onChange={(e) => handleSchoolChange(e.target.value)}
					>
						<option value="">Select School / स्कूल चुनें</option>
						{schoolDepartmentData.map((school) => (
							<option key={school.name} value={school.name}>
								{school.name}
							</option>
						))}
					</select>
					{errors.schoolName && (
						<p className="text-sm text-destructive">{errors.schoolName}</p>
					)}
				</div>

				<div className="nss-form-group">
					<label className="nss-form-label">
						Department / विभाग{" "}
						<span className="text-destructive">*</span>
					</label>
					<select
						className={`nss-form-select ${
							errors.departmentName ? "border-destructive" : ""
						}`}
						value={formData.departmentName}
						onChange={(e) => handleInputChange("departmentName", e.target.value)}
						disabled={!formData.schoolName}
					>
						<option value="">
							{formData.schoolName
								? "Select Department / विभाग चुनें"
								: "Please select school first"}
						</option>
						{getAvailableDepartments().map((department) => (
							<option key={department} value={department}>
								{department}
							</option>
						))}
					</select>
					{errors.departmentName && (
						<p className="text-sm text-destructive">{errors.departmentName}</p>
					)}
				</div>

				{/* Course Name and Class/Semester side by side */}
				<div className="nss-form-group">
					<label className="nss-form-label">
						Course Name / कोर्स का नाम <span className="text-destructive">*</span>
					</label>
					<input
						type="text"
						className={`nss-form-input ${errors.courseName ? "border-destructive" : ""}`}
						value={formData.courseName}
						onChange={(e) => handleInputChange("courseName", e.target.value)}
						placeholder="Enter your course name"
					/>
					{errors.courseName && <p className="text-sm text-destructive">{errors.courseName}</p>}
				</div>
				<div className="nss-form-group">
					<label className="nss-form-label">
						Class/Semester / कक्षा/सेमेस्टर <span className="text-destructive">*</span>
					</label>
					<select
						className={`nss-form-select ${errors.classSemester ? "border-destructive" : ""}`}
						value={formData.classSemester}
						onChange={(e) => handleInputChange("classSemester", e.target.value)}
					>
						<option value="">Select Class/Semester</option>
						<option value="1st Year / 1st & 2nd Semester">1st Year / 1st & 2nd Semester</option>
						<option value="2nd Year / 3rd & 4th Semester">2nd Year / 3rd & 4th Semester</option>
						<option value="3rd Year / 5th & 6th Semester">3rd Year / 5th & 6th Semester</option>
						<option value="4th Year / 7th & 8th Semester">4th Year / 7th & 8th Semester</option>
						<option value="5th Year / 9th & 10th Semester">5th Year / 9th & 10th Semester</option>
					</select>
					{errors.classSemester && <p className="text-sm text-destructive">{errors.classSemester}</p>}
				</div>

				{/* Institutional I-Card Number */}
				<div className="nss-form-group">
					<label className="nss-form-label">
						Institutional I-Card Number / संस्थागत आई-कार्ड नंबर{" "}
						<span className="text-destructive">*</span>
					</label>
					<input
						type="text"
						className={`nss-form-input ${errors.institutionalIdCard ? "border-destructive" : ""}`}
						value={formData.institutionalIdCard}
						onChange={(e) => handleInputChange("institutionalIdCard", e.target.value)}
						placeholder="Enter Institutional I-Card Number"
					/>
					{errors.institutionalIdCard && <p className="text-sm text-destructive">{errors.institutionalIdCard}</p>}
				</div>

				{/* Gender */}
				<div className="nss-form-group">
					<label className="nss-form-label">
						Gender / लिंग <span className="text-destructive">*</span>
					</label>
					<select
						className={`nss-form-select ${errors.gender ? "border-destructive" : ""}`}
						value={formData.gender}
						onChange={(e) => handleInputChange("gender", e.target.value)}
					>
						<option value="">Select Gender</option>
						<option value="male">Male / पुरुष</option>
						<option value="female">Female / महिला</option>
						<option value="other">Other / अन्य</option>
					</select>
					{errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
				</div>

				{/* Blood Group Dropdown */}
				<div className="nss-form-group">
					<label className="nss-form-label">
						Blood Group / रक्त समूह <span className="text-destructive">*</span>
					</label>
					<select
						className={`nss-form-select ${errors.bloodGroup ? "border-destructive" : ""}`}
						value={formData.bloodGroup}
						onChange={(e) => handleInputChange("bloodGroup", e.target.value)}
					>
						<option value="">Select Blood Group</option>
						<option value="A+">A+</option>
						<option value="A-">A-</option>
						<option value="B+">B+</option>
						<option value="B-">B-</option>
						<option value="O+">O+</option>
						<option value="O-">O-</option>
						<option value="AB+">AB+</option>
						<option value="AB-">AB-</option>
					</select>
					{errors.bloodGroup && <p className="text-sm text-destructive">{errors.bloodGroup}</p>}
				</div>

				{/* Address Section */}
				<div className="nss-form-group md:col-span-2">
					<label className="nss-form-label">
						Are you a Hostler or Day Scholar? / क्या आप होस्टलर हैं या डे स्कॉलर?
						<span className="text-destructive">*</span>
					</label>
					<div className="flex gap-4 mt-2">
						<label>
							<input
								type="radio"
								name="addressType"
								value="hostler"
								checked={formData.addressType === "hostler"}
								onChange={() => handleInputChange("addressType", "hostler")}
							/> Hostler / होस्टलर
						</label>
						<label>
							<input
								type="radio"
								name="addressType"
								value="dayscholar"
								checked={formData.addressType === "dayscholar"}
								onChange={() => handleInputChange("addressType", "dayscholar")}
							/> Day Scholar / डे स्कॉलर
						</label>
					</div>
					{errors.addressType && <p className="text-sm text-destructive">{errors.addressType}</p>}
					{formData.addressType === "hostler" && (
						<div className="mt-2">
							<input
								type="text"
								className={`nss-form-input ${errors.hostelAddress ? "border-destructive" : ""}`}
								value={formData.hostelAddress}
								onChange={(e) => handleInputChange("hostelAddress", e.target.value)}
								placeholder="Enter hostel address"
							/>
							{errors.hostelAddress && <p className="text-sm text-destructive">{errors.hostelAddress}</p>}
						</div>
					)}
					{formData.addressType === "dayscholar" && (
						<div className="mt-2">
							<input
								type="text"
								className={`nss-form-input ${errors.homeAddress ? "border-destructive" : ""}`}
								value={formData.homeAddress}
								onChange={(e) => handleInputChange("homeAddress", e.target.value)}
								placeholder="Enter home address"
							/>
							{errors.homeAddress && <p className="text-sm text-destructive">{errors.homeAddress}</p>}
						</div>
					)}
				</div>
			</div>

			<div className="flex justify-between mt-8">
				<button onClick={onPrevious} className="nss-button-outline flex items-center">
					<svg
						className="w-4 h-4 mr-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
					</svg>
					Previous / पिछला
				</button>
				<button onClick={handleNext} className="nss-button-primary">
					Next / आगे
					<svg
						className="w-4 h-4 ml-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</button>
			</div>
		</div>
	)
}
