import { DomainError } from "./errors";
import {
  assertPersonName,
  isEmail,
  normalizeEmail,
  normalizeLicence,
  normalizePhone,
  normalizePlate,
} from "./text";
import { assertVehicleYear } from "./rides";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  phone: string;
  isPassenger: boolean;
  isDriver: boolean;
};

export function parseRegister(input: RegisterInput): RegisterInput & { phone: string; email: string; name: string } {
  const name = assertPersonName(input.name);
  const email = normalizeEmail(input.email);
  if (!isEmail(email)) throw new DomainError("INVALID_EMAIL");
  if (input.password.length < 10 || input.password.length > 72) {
    throw new DomainError("WEAK_PASSWORD");
  }
  const phone = normalizePhone(input.phone);
  if (!phone) throw new DomainError("INVALID_PHONE");
  if (!input.isPassenger && !input.isDriver) throw new DomainError("ROLE_REQUIRED");
  return { ...input, name, email, phone };
}

export type DriverApplication = {
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleColor: string;
  plateNumber: string;
  vehicleSeats: number;
  licenceNumber: string;
};

export function parseDriverApplication(input: DriverApplication, now = new Date()): DriverApplication {
  const vehicleMake = input.vehicleMake.trim().replace(/\s+/g, " ");
  const vehicleModel = input.vehicleModel.trim().replace(/\s+/g, " ");
  const vehicleColor = input.vehicleColor.trim().replace(/\s+/g, " ");
  if (vehicleMake.length < 2 || vehicleMake.length > 40) throw new DomainError("INVALID_VEHICLE");
  if (vehicleModel.length < 1 || vehicleModel.length > 40) throw new DomainError("INVALID_VEHICLE");
  if (vehicleColor.length < 3 || vehicleColor.length > 30) throw new DomainError("INVALID_VEHICLE");
  assertVehicleYear(input.vehicleYear, now);
  if (!Number.isInteger(input.vehicleSeats) || input.vehicleSeats < 2 || input.vehicleSeats > 7) {
    throw new DomainError("INVALID_VEHICLE");
  }
  const plateNumber = normalizePlate(input.plateNumber);
  if (!plateNumber) throw new DomainError("INVALID_PLATE");
  const licenceNumber = normalizeLicence(input.licenceNumber);
  if (!licenceNumber) throw new DomainError("INVALID_LICENCE");
  return {
    vehicleMake,
    vehicleModel,
    vehicleYear: input.vehicleYear,
    vehicleColor,
    plateNumber,
    vehicleSeats: input.vehicleSeats,
    licenceNumber,
  };
}

export function assertCanReview(reviewerId: string, driverUserId: string): void {
  if (reviewerId === driverUserId) throw new DomainError("CANNOT_REVIEW_SELF", 403);
}
