import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Header, Stepper, Button, InlineBanner } from "@hotelos/ui/components";

/**
 * Standard responsive layout frame for all reservation wizards:
 * - Header with page title, channel badge, and back button
 * - Centered step indicator
 * - 2-column content grid: Left step body, Right sticky summary rail
 * - Bottom action bar
 */
export default function ReservationWizardLayout({
  title,
  subtitle,
  badge = null,
  steps,
  currentStep,
  onStepClick,
  onBack,
  onPrevStep,
  onNextStep,
  onSaveDraft,
  onSubmit,
  isSubmitting = false,
  submitText = "Create Reservation",
  submitError = "",
  summaryPanel,
  banner = null,
  children,
}) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="bg-background-50/50 min-h-screen pb-24">
      {/* Top Header */}
      <Header pageTitle={title} pageDescription={subtitle}>
        <div className="flex items-center gap-2">
          {badge}
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </Header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Channel Banner if any */}
        {banner && <div className="mb-6">{banner}</div>}

        {/* Global Submit Error */}
        {submitError && (
          <div className="mb-6">
            <InlineBanner variant="error">{submitError}</InlineBanner>
          </div>
        )}

        {/* Stepper Progress Bar */}
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
          <Stepper
            steps={steps}
            currentStep={currentStep}
            onStepClick={onStepClick}
          />
        </div>

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-12 gap-8">
          {/* Main Content (Step View) */}
          <div className="col-span-12 space-y-6 xl:col-span-8">
            {children}

            {/* Stepper Bottom Controls inside flow */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <Button
                variant="outline"
                onClick={isFirstStep ? onBack : onPrevStep}
                disabled={isSubmitting}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {isFirstStep ? "Cancel" : "Previous"}
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={onSaveDraft}
                  disabled={isSubmitting}
                >
                  Save as Draft
                </Button>

                {!isLastStep ? (
                  <Button
                    variant="primary"
                    onClick={onNextStep}
                    disabled={isSubmitting}
                    className="gap-2"
                  >
                    Next Step
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="gap-2"
                  >
                    {isSubmitting ? "Processing..." : submitText}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right Rail: Sticky Summary */}
          <div className="col-span-12 xl:col-span-4">
            <div className="sticky top-6 space-y-6">{summaryPanel}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
