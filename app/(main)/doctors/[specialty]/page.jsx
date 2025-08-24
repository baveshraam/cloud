// File: app/(main)/doctors/[specialty]/[id]/page.jsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // Make sure to import useRouter
import useFetch from "@/hooks/use-fetch";
import { getDoctorById, getAvailableTimeSlots } from "@/actions/appointments";

import { DoctorProfile } from "./_components/doctor-profile";
import { SlotPicker } from "./_components/slot-picker";
import { AppointmentForm } from "./_components/appointment-form";
import { Loader2 } from "lucide-react";

export default function DoctorDetailPage({ params }) {
  const { id: doctorId } = params;
  const router = useRouter(); // Initialize the router

  // State to manage the currently selected time slot
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Fetch doctor details and available slots
  const { data: doctorData, loading: doctorLoading } = useFetch(
    getDoctorById,
    doctorId
  );
  const {
    data: slotsData,
    loading: slotsLoading,
    error: slotsError,
  } = useFetch(getAvailableTimeSlots, doctorId);

  // Function to handle slot selection
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  // Function to go back from the confirmation form to the slot picker
  const handleBack = () => {
    setSelectedSlot(null);
  };

  // ✅ THIS IS THE CORRECTED FUNCTION
  // This function is called by AppointmentForm on a successful booking.
  // It now correctly redirects the user to their appointments page.
  const handleBookingComplete = () => {
    router.push("/appointments");
  };

  // Loading state
  if (doctorLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  const doctor = doctorData?.doctor;
  if (!doctor) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Doctor not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left side: Doctor's Profile */}
        <div className="md:col-span-1">
          <DoctorProfile doctor={doctor} />
        </div>

        {/* Right side: Slot Picker or Confirmation Form */}
        <div className="md:col-span-1">
          <div className="bg-background/40 p-6 rounded-lg border border-emerald-900/30">
            {selectedSlot ? (
              // If a slot is selected, show the appointment confirmation form
              <AppointmentForm
                doctorId={doctorId}
                slot={selectedSlot}
                onBack={handleBack}
                onComplete={handleBookingComplete} // Pass the corrected function here
              />
            ) : (
              // Otherwise, show the time slot picker
              <SlotPicker
                slotsData={slotsData}
                loading={slotsLoading}
                error={slotsError}
                onSlotSelect={handleSlotSelect}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
