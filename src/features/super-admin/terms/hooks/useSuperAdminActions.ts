"use client";

import { useState, useEffect } from "react";
import { SuperAdminOrg, SubscriptionTier } from "@/features/super-admin/types";
import { Term } from "@/features/super-admin/types";

export default function useSuperAdminActions() {

  const onSetNewActiveTerm = async (AY: string, semester: string) => {
    try {
      
    } catch (error) {
      
    }
  }

  const onAddTerm = async (term: Term, setActive?: boolean) => {
    try {

    } catch (error) {

    }
  }
  return {
    onSetNewActiveTerm,
    onAddTerm
  };
}