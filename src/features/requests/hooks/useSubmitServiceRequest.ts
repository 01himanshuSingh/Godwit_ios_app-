import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

import type { AppRequest, AppServiceCategory } from '@/lib/firebase/enquiries';
import {
  createEnquiryRequestId,
  mapEnquirySubmitErrorToMessage,
  submitServiceRequestToCrmEnquiry,
} from '@/lib/firebase/enquiries';
import { useActiveClientProfile } from '@/lib/session/useActiveClientProfile';

export type SubmitServiceRequestInput = {
  category: AppServiceCategory;
  main: string;
  when?: string;
  extra?: string;
  notes?: string;
  travellerIds: string[];
  travellers: { id: string; name: string }[];
  crmFields?: Record<string, string | number>;
  remarkLines?: string[];
};

/**
 * Shared submit for all request forms → one CRM enquiry writer.
 * Generates a stable appRequestId per press so retries stay idempotent.
 */
export function useSubmitServiceRequest(): {
  submitting: boolean;
  submit: (input: SubmitServiceRequestInput) => Promise<boolean>;
  submitRequest: (request: AppRequest) => Promise<boolean>;
} {
  const { profile } = useActiveClientProfile();
  const [submitting, setSubmitting] = useState(false);
  const inFlightRef = useRef(false);

  const submitRequest = useCallback(
    async (request: AppRequest): Promise<boolean> => {
      if (inFlightRef.current) {
        return false;
      }

      const adminId = profile?.adminId?.trim() ?? '';
      const clientId = profile?.clientId?.trim() ?? '';
      const clientName = profile?.name?.trim() ?? '';

      if (!adminId || !clientId) {
        Alert.alert(
          'Sign in required',
          'Your session is missing client details. Please sign out and sign in again.',
        );
        return false;
      }

      const main = request.main.trim();
      if (!main) {
        Alert.alert('Missing details', 'Please fill in the main details for this request.');
        return false;
      }
      const appRequestId = createEnquiryRequestId(adminId);

      inFlightRef.current = true;
      setSubmitting(true);
      try {
        await submitServiceRequestToCrmEnquiry(
          { adminId, clientId, clientName },
          {
            ...request,
            main,
            when: request.when?.trim() || undefined,
            extra: request.extra?.trim() || undefined,
            notes: request.notes?.trim() || undefined,
          },
          appRequestId,
        );
        Alert.alert('Request sent', 'Your Godwit team can see this on the client Enquiries tab.');
        return true;
      } catch (error) {
        Alert.alert('Couldn’t send', mapEnquirySubmitErrorToMessage(error));
        return false;
      } finally {
        inFlightRef.current = false;
        setSubmitting(false);
      }
    },
    [profile?.adminId, profile?.clientId, profile?.name],
  );

  const submit = useCallback(
    async (input: SubmitServiceRequestInput): Promise<boolean> => {
      return submitRequest({
        category: input.category,
        main: input.main,
        when: input.when,
        extra: input.extra,
        notes: input.notes,
        travellerIds: input.travellerIds,
        travellers: input.travellers,
        crmFields: input.crmFields,
        remarkLines: input.remarkLines,
      });
    },
    [submitRequest],
  );

  return { submitting, submit, submitRequest };
}
