"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertCircle,
  CreditCard,
  Plus,
  Trash2,
  Loader,
  MoreVertical,
  Check,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { paymentApi } from "@/lib/api/payment";
import { orgPaymentsApi } from "@/lib/api/orgs/payments";
import { CardPaymentMethodModal } from "@/components/ui/modals";
import { PromptModal } from "@/components/ui/modals";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/queryKeys";
import { useAuthStore } from "@/stores";
import type { PaymentMethod } from "@/lib/api/orgs/payments";

interface PaymentMethodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOrganization?: boolean;
}

export function PaymentMethodsModal({
  isOpen,
  onClose,
  isOrganization = false,
}: PaymentMethodsModalProps) {
  const queryClient = useQueryClient();
  const { organizationDetails } = useAuthStore();
  const orgId = organizationDetails?.id?.toString();

  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [deletePrompt, setDeletePrompt] = useState<{
    isOpen: boolean;
    methodId: string | null;
  }>({
    isOpen: false,
    methodId: null,
  });

  const {
    data: paymentMethodsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.orgPaymentMethods(orgId || ""),
    queryFn: async () => {
      const response = await orgPaymentsApi.getPaymentMethods();
      return response.payment_methods || [];
    },
    enabled: isOpen && isOrganization && !!orgId,
    staleTime: Infinity,
    gcTime: Infinity, 
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const displayMethods: PaymentMethod[] = isOrganization
    ? paymentMethodsData || []
    : [];

  const cardBrandLabel = (brand?: string) =>
    brand ? brand.charAt(0).toUpperCase() + brand.slice(1) : "";

  const handleDeletePaymentMethod = (methodId: string) => {
    setDeletePrompt({
      isOpen: true,
      methodId,
    });
  };

  const handleSetDefaultPaymentMethod = async (methodId: string) => {
    try {
      setIsSettingDefault(true);

      const response = isOrganization
        ? await orgPaymentsApi.setDefaultPaymentMethod(methodId)
        : await paymentApi.setDefaultPaymentMethod(methodId);

      if (response.status) {
        // Only invalidate query cache for organization users
        if (isOrganization) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.orgPaymentMethods(orgId || ""),
          });
        }

        toast.success("Default payment method updated");
      } else {
        toast.error("Failed to update default payment method");
      }
    } catch (error: any) {
      // console.error("Error setting default payment method:", error);
      toast.error("Failed to update default payment method");
    } finally {
      setIsSettingDefault(false);
    }
  };

  const handleRemovePaymentMethod = async (methodId: string) => {
    try {
      setIsDeleting(true);

      const response = isOrganization
        ? await orgPaymentsApi.removePaymentMethod(methodId)
        : await paymentApi.removePaymentMethod(methodId);

      if (response.status) {
        // Only invalidate query cache for organization users
        if (isOrganization) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.orgPaymentMethods(orgId || ""),
          });
        }

        toast.success("Payment method removed successfully");
      } else {
        toast.error("Failed to remove payment method");
      }
    } catch (error: any) {
      // console.error("Error removing payment method:", error);
      toast.error("Failed to remove payment method");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setDeletePrompt({ isOpen: false, methodId: null });
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden flex flex-col gap-0">
          <DialogHeader className="px-5 pt-5 pb-3 flex-shrink-0">
            <DialogTitle className="text-lg font-semibold">
              Payment Methods
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Manage your saved payment methods
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              <div className="px-5 pb-5 space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="px-5 pb-5">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="text-xs font-medium text-red-900 dark:text-red-200">
                      Failed to load payment methods
                    </div>
                    <div className="text-xs text-red-700 dark:text-red-400">
                      {String(error)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                      className="mt-2 h-7 text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1.5" />
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            ) : displayMethods.length === 0 ? (
              <div className="text-center py-8">
                <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium mb-1">No payment methods</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Add a payment method to get started
                </p>
                <Button
                  onClick={() => setShowAddCardModal(true)}
                  size="sm"
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Payment Method
                </Button>
              </div>
            ) : (
              <div className="px-5 pb-5 space-y-2">
                {displayMethods.map((method, index) => (
                  <motion.div
                    key={method.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="group flex items-center gap-2 p-3 bg-card border border-border rounded-lg hover:border-primary/30 hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-9 w-9 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CreditCard className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-sm font-semibold">
                              {cardBrandLabel(method.brand)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              •••• {method.last4}
                            </span>
                            {method.default && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                              >
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Expires{" "}
                            {method.exp_month.toString().padStart(2, "0")}/
                            {method.exp_year.toString().slice(-2)}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={isDeleting || isSettingDefault}
                          >
                            {isDeleting || isSettingDefault ? (
                              <Loader className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <MoreVertical className="h-3.5 w-3.5" />
                            )}
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          {!method.default && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleSetDefaultPaymentMethod(method.id)
                              }
                              disabled={isSettingDefault}
                              className="text-xs"
                            >
                              <Check className="h-3.5 w-3.5 mr-2" />
                              <span>Set as Default</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDeletePaymentMethod(method.id)}
                            className="text-red-600 focus:text-red-600 dark:text-red-500 text-xs"
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            <span>Remove</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {displayMethods.length > 0 && (
            <div className="px-5 py-3 border-t border-borderColorPrimary flex-shrink-0 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {displayMethods.length} payment method
                  {displayMethods.length !== 1 ? "s" : ""}
                </div>
                <Button
                  onClick={() => setShowAddCardModal(true)}
                  size="sm"
                  className="gap-1.5 h-8"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add New
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Card Modal */}
      <CardPaymentMethodModal
        isOpen={showAddCardModal}
        onClose={() => {
          setShowAddCardModal(false);
          // Only invalidate query cache for organization users
          if (isOrganization) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.orgPaymentMethods(orgId || ""),
            });
          }
        }}
        mode="add"
      />

      {/* Delete Confirmation Modal */}
      <PromptModal
        isOpen={deletePrompt.isOpen}
        onClose={() => setDeletePrompt({ isOpen: false, methodId: null })}
        title="Remove Payment Method"
        message="Are you sure you want to remove this payment method? This action cannot be undone and may affect your subscription if it's the only payment method."
        type="warning"
        actions={[
          {
            label: "Cancel",
            onClick: () => setDeletePrompt({ isOpen: false, methodId: null }),
            variant: "outline",
          },
          {
            label: "Remove",
            onClick: async () => {
              if (deletePrompt.methodId && !isDeleting) {
                await handleRemovePaymentMethod(deletePrompt.methodId);
                setDeletePrompt({ isOpen: false, methodId: null });
              }
            },
            variant: "destructive",
            disabled: isDeleting,
            icon: isDeleting ? (
              <Loader className="h-4 w-4 animate-spin mr-2" />
            ) : undefined,
          },
        ]}
      />
    </>
  );
}
