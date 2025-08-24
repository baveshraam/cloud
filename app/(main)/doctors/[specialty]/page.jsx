import { getDoctorsBySpecialty } from "@/actions/doctors-listing";
import { DoctorCard } from "../components/doctor-card";
import { PageHeader } from "@/components/page-header";

export default async function SpecialtyPage({ params }) {
  const { specialty } = params;

  // Decode the specialty from the URL (e.g., "mental-health" -> "Mental Health")
  const decodedSpecialty = decodeURIComponent(specialty)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const { doctors, error } = await getDoctorsBySpecialty(decodedSpecialty);

  if (error) {
    return (
      <div className="text-center py-12 text-destructive">
        <p>Could not fetch doctors. Please try again later.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Available Doctors in ${decodedSpecialty}`}
        description={`Browse and book appointments with our verified specialists in ${decodedSpecialty}.`}
      />

      {doctors && doctors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No doctors found for this specialty.</p>
        </div>
      )}
    </div>
  );
}
