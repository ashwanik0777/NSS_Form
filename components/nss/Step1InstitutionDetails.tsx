"use client"

import { useEffect, useState } from "react"
import type { StepProps } from "@/lib/types"

// Coordinator data with their respective units
const coordinatorData = [
	{
		name: "Dr. Gaurav Kumar",
		units: ["1"],
	},
	{
		name: "Dr. Bhaswati Banerjee",
		units: ["2"],
	},
	{
		name: "Dr. Rahul Kapoor",
		units: ["3"],
	},
	{
		name: "Dr. Rakesh Kumar (Y)",
		units: ["4"],
	},
	{
		name: "Dr. Shrutee Kanwar",
		units: ["5"],
	},
]

type UnitCapacityInfo = {
	count: number
	maxCapacity: number
	available: number
	isFull: boolean
}

export default function Step1InstitutionDetails({
	formData,
	setFormData,
	errors,
	setErrors,
	onNext,
}: StepProps) {
	const [unitCapacities, setUnitCapacities] = useState<Record<string, UnitCapacityInfo>>({})
	const [unitCapacityLoading, setUnitCapacityLoading] = useState(true)
	const [unitCapacityError, setUnitCapacityError] = useState("")

	useEffect(() => {
		let isMounted = true

		const fetchUnitCapacities = async () => {
			try {
				setUnitCapacityLoading(true)
				const response = await fetch("/api/public/unit-capacity")
				const data = await response.json()

				if (!response.ok || !data.success) {
					throw new Error(data.message || "Failed to load unit capacity")
				}

				if (!Array.isArray(data.units)) {
					throw new Error("Invalid unit capacity response")
				}

				if (isMounted) {
					const capacityMap: Record<string, UnitCapacityInfo> = {}
					data.units.forEach((unit: UnitCapacityInfo & { unitNo: string }) => {
						capacityMap[unit.unitNo] = {
							count: unit.count,
							maxCapacity: unit.maxCapacity,
							available: unit.available,
							isFull: unit.isFull,
						}
					})
					setUnitCapacities(capacityMap)
					setUnitCapacityError("")
				}
			} catch (error) {
				console.error("Error fetching unit capacity:", error)
				if (isMounted) {
					setUnitCapacityError("Unable to load unit capacity right now. Please refresh before submitting.")
				}
			} finally {
				if (isMounted) {
					setUnitCapacityLoading(false)
				}
			}
		}

		fetchUnitCapacities()

		return () => {
			isMounted = false
		}
	}, [])

	useEffect(() => {
		if (!formData.unitNo) return
		const capacity = unitCapacities[formData.unitNo]
		if (capacity?.isFull) {
			setErrors((prev) => ({
				...prev,
				unitNo: `Unit ${formData.unitNo} is full. Please select another unit.`,
			}))
			setFormData((prev) => ({ ...prev, unitNo: "" }))
		}
	}, [formData.unitNo, unitCapacities, setErrors, setFormData])

	const handleInputChange = (field: string, value: string) => {
		setFormData({ ...formData, [field]: value })
		if (errors[field]) {
			setErrors({ ...errors, [field]: "" })
		}
	}

	const handleCoordinatorChange = (coordinatorName: string) => {
		// Find the selected coordinator's data
		const selectedCoordinator = coordinatorData.find(
			(coord) => coord.name === coordinatorName
		)

		// Update form data with coordinator name and clear unit selection
		setFormData({
			...formData,
			programOfficerName: coordinatorName,
			unitNo: "", // Clear unit selection when coordinator changes
		})

		// Clear errors
		if (errors.programOfficerName) {
			setErrors({ ...errors, programOfficerName: "", unitNo: "" })
		}
	}

	const getAvailableUnits = () => {
		const selectedCoordinator = coordinatorData.find(
			(coord) => coord.name === formData.programOfficerName
		)
		return selectedCoordinator ? selectedCoordinator.units : []
	}

	const isUnitFull = (unitNo: string) => {
		const info = unitCapacities[unitNo]
		return info ? info.isFull : false
	}

	const seatsLeft = (unitNo: string) => {
		const info = unitCapacities[unitNo]
		return typeof info?.available === "number" ? info.available : null
	}

	const coordinatorUnits = getAvailableUnits()
	const allCoordinatorUnitsFull =
		coordinatorUnits.length > 0 &&
		coordinatorUnits.every((unit) => {
			const info = unitCapacities[unit]
			return info ? info.isFull : false
		})

	const handleNext = () => {
		const stepErrors: any = {}

		if (!formData.institutionName.trim()) {
			stepErrors.institutionName = "Institution name is required"
		}

		if (!formData.enrollment) {
			stepErrors.enrollment = "Enrollment type is required"
		}
		if (!formData.programOfficerName.trim()) {
			stepErrors.programOfficerName = "Program officer name is required"
		}
		if (!formData.unitNo.trim()) {
			stepErrors.unitNo = "Unit number is required"
		} else if (isUnitFull(formData.unitNo)) {
			stepErrors.unitNo = `Unit ${formData.unitNo} is full. Please select another unit.`
		}

		if (coordinatorUnits.length > 0 && allCoordinatorUnitsFull) {
			stepErrors.unitNo =
				stepErrors.unitNo ||
				"All units under the selected coordinator are currently full. Please contact the NSS office for assistance."
		}

		if (Object.keys(stepErrors).length > 0) {
			setErrors({ ...errors, ...stepErrors })
			return
		}

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
							d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
						/>
					</svg>
				</div>
				<div>
					<h2 className="text-2xl font-bold text-foreground">
						Institution Details
					</h2>
					<p className="text-muted-foreground">संस्थान का विवरण</p>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="nss-form-group">
					<label className="nss-form-label">
						Institution Name / संस्थान का नाम{" "}
						<span className="text-destructive">*</span>
					</label>
					<input
						type="text"
						className="nss-form-input bg-muted"
						value="Gautam Buddha University"
						readOnly
						disabled
					/>
					{errors.institutionName && (
						<p className="text-sm text-destructive">
							{errors.institutionName}
						</p>
					)}
				</div>

				<div className="nss-form-group">
					<label className="nss-form-label">
						Enrollment / नामांकन <span className="text-destructive">*</span>
					</label>
					<select
						className={`nss-form-select ${
							errors.enrollment ? "border-destructive" : ""
						}`}
						value={formData.enrollment}
						onChange={(e) => handleInputChange("enrollment", e.target.value)}
					>
						<option value="">Select enrollment type</option>
						<option value="first-year">First Year / प्रथम वर्ष</option>
						<option value="second-year">Second Year / द्वितीय वर्ष</option>
						<option value="third-year">Third Year / तृतीय वर्ष</option>
						<option value="fourth-year">Fourth Year / चतुर्थ वर्ष</option>
					</select>
					{errors.enrollment && (
						<p className="text-sm text-destructive">{errors.enrollment}</p>
					)}
				</div>

				<div className="nss-form-group">
					<label className="nss-form-label">
						Programme Officer / Coordinator Name / कार्यक्रम अधिकारी /
						समन्वयक का नाम <span className="text-destructive">*</span>
					</label>
					<select
						className={`nss-form-select ${
							errors.programOfficerName ? "border-destructive" : ""
						}`}
						value={formData.programOfficerName}
						onChange={(e) => handleCoordinatorChange(e.target.value)}
					>
						<option value="">Select Programme Officer / Coordinator</option>
						{coordinatorData.map((coordinator) => (
							<option key={coordinator.name} value={coordinator.name}>
								{coordinator.name}
							</option>
						))}
					</select>
					{errors.programOfficerName && (
						<p className="text-sm text-destructive">
							{errors.programOfficerName}
						</p>
					)}
				</div>

				<div className="nss-form-group">
					<label className="nss-form-label">
						Unit Number / इकाई संख्या <span className="text-destructive">*</span>
					</label>
					<select
						className={`nss-form-select ${
							errors.unitNo ? "border-destructive" : ""
						}`}
						value={formData.unitNo}
						onChange={(e) => handleInputChange("unitNo", e.target.value)}
						disabled={!formData.programOfficerName}
					>
						<option value="">
							{formData.programOfficerName
								? "Select unit number"
								: "Please select coordinator first"}
						</option>
						{getAvailableUnits().map((unit) => (
							<option key={unit} value={unit} disabled={isUnitFull(unit)}>
								Unit {unit} / इकाई {unit}
								{unitCapacities[unit]
									? unitCapacities[unit].isFull
										? " (Full)"
										: ` (${unitCapacities[unit].available} seats left)`
									: ""}
							</option>
						))}
					</select>
					{errors.unitNo && <p className="text-sm text-destructive">{errors.unitNo}</p>}
					{unitCapacityLoading && (
						<p className="text-xs text-muted-foreground mt-1">Checking unit availability...</p>
					)}
					{unitCapacityError && (
						<p className="text-sm text-destructive mt-1">{unitCapacityError}</p>
					)}
					{formData.unitNo && !isUnitFull(formData.unitNo) && seatsLeft(formData.unitNo) !== null && (
						<p className="text-xs text-emerald-700 mt-1">
							Seats available in Unit {formData.unitNo}: {seatsLeft(formData.unitNo)}
						</p>
					)}
					{formData.programOfficerName && allCoordinatorUnitsFull && (
						<p className="text-xs text-destructive mt-1">
							All units under this coordinator are currently full. Please contact the NSS office or try another
							coordinator if available.
						</p>
					)}
				</div>
			</div>

			<div className="flex justify-end mt-8">
				<button onClick={handleNext} className="nss-button-primary">
					Next / आगे
					<svg
						className="w-4 h-4 ml-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>
			</div>
		</div>
	)
}
