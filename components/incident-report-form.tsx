import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface ReportData {
  site?: string;
  address?: string;
  issueType?: string;
  description?: string;
  actionsTaken?: string;
  partsUsed?: string;
  photos?: string[];
  status?: "resolved" | "temporary" | "follow_up";
  followUpNotes?: string;
  techSignature?: string;
  customerSignature?: string;
}

interface IncidentReportFormProps {
  incidentId: number;
  onSaved?: () => void;
}

export function IncidentReportForm({ incidentId, onSaved }: IncidentReportFormProps) {
  const colors = useColors();
  const [formData, setFormData] = useState<ReportData>({
    status: "resolved",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing report
  const { data: existingReport, isLoading, refetch } = trpc.reports.getByIncident.useQuery({
    incidentId,
  });

  // Mutations
  const upsertDraftMutation = trpc.reports.upsertDraft.useMutation({
    onSuccess: () => {
      refetch();
      onSaved?.();
      Alert.alert("Success", "Draft saved successfully");
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const submitMutation = trpc.reports.submit.useMutation({
    onSuccess: () => {
      refetch();
      onSaved?.();
      Alert.alert("Success", "Report submitted successfully");
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  // Load existing report data
  useEffect(() => {
    if (existingReport?.jsonData) {
      setFormData(existingReport.jsonData);
    }
  }, [existingReport]);

  const isSubmitted = existingReport?.status === "submitted";
  const isReadOnly = isSubmitted;

  const handleSaveDraft = () => {
    setIsSaving(true);
    upsertDraftMutation.mutate({
      incidentId,
      data: formData,
    });
    setIsSaving(false);
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.description || !formData.actionsTaken) {
      Alert.alert("Validation Error", "Description and Actions Taken are required");
      return;
    }

    Alert.alert(
      "Confirm Submission",
      "Once submitted, the report cannot be edited. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          style: "default",
          onPress: () => {
            setIsSaving(true);
            submitMutation.mutate({
              incidentId,
              data: formData,
            });
            setIsSaving(false);
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 p-6 gap-4">
        {/* Status Badge */}
        {isSubmitted && (
          <View className="bg-success/10 rounded-2xl p-4 border border-success">
            <Text className="text-sm font-bold" style={{ color: colors.success }}>
              ✓ Report Submitted
            </Text>
            <Text className="text-xs text-muted mt-1">
              Submitted on {new Date(existingReport.updatedAt).toLocaleString()}
            </Text>
          </View>
        )}

        {/* Site/Address */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-foreground">Site/Address</Text>
          <TextInput
            className={cn(
              "bg-surface rounded-xl p-4 text-base text-foreground border border-border",
              isReadOnly && "opacity-60"
            )}
            placeholder="Enter site or address"
            placeholderTextColor={colors.muted}
            value={formData.site || ""}
            onChangeText={(text) => setFormData({ ...formData, site: text })}
            editable={!isReadOnly}
          />
        </View>

        {/* Issue Type */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-foreground">Issue Type</Text>
          <TextInput
            className={cn(
              "bg-surface rounded-xl p-4 text-base text-foreground border border-border",
              isReadOnly && "opacity-60"
            )}
            placeholder="e.g., Fire alarm, Panel trouble"
            placeholderTextColor={colors.muted}
            value={formData.issueType || ""}
            onChangeText={(text) => setFormData({ ...formData, issueType: text })}
            editable={!isReadOnly}
          />
        </View>

        {/* Description */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-foreground">
            Description <Text className="text-error">*</Text>
          </Text>
          <TextInput
            className={cn(
              "bg-surface rounded-xl p-4 text-base text-foreground border border-border",
              isReadOnly && "opacity-60"
            )}
            placeholder="Describe the issue"
            placeholderTextColor={colors.muted}
            value={formData.description || ""}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isReadOnly}
          />
        </View>

        {/* Actions Taken */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-foreground">
            Actions Taken <Text className="text-error">*</Text>
          </Text>
          <TextInput
            className={cn(
              "bg-surface rounded-xl p-4 text-base text-foreground border border-border",
              isReadOnly && "opacity-60"
            )}
            placeholder="Describe actions taken to resolve the issue"
            placeholderTextColor={colors.muted}
            value={formData.actionsTaken || ""}
            onChangeText={(text) => setFormData({ ...formData, actionsTaken: text })}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!isReadOnly}
          />
        </View>

        {/* Parts Used */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-foreground">Parts Used (Optional)</Text>
          <TextInput
            className={cn(
              "bg-surface rounded-xl p-4 text-base text-foreground border border-border",
              isReadOnly && "opacity-60"
            )}
            placeholder="List any parts used"
            placeholderTextColor={colors.muted}
            value={formData.partsUsed || ""}
            onChangeText={(text) => setFormData({ ...formData, partsUsed: text })}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            editable={!isReadOnly}
          />
        </View>

        {/* Status */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-foreground">Status</Text>
          <View className="flex-row gap-2">
            {(["resolved", "temporary", "follow_up"] as const).map((status) => (
              <TouchableOpacity
                key={status}
                className={cn(
                  "flex-1 rounded-xl p-3 border",
                  formData.status === status
                    ? "bg-primary/10 border-primary"
                    : "bg-surface border-border"
                )}
                onPress={() => !isReadOnly && setFormData({ ...formData, status })}
                disabled={isReadOnly}
              >
                <Text
                  className={cn(
                    "text-center text-sm font-semibold",
                    formData.status === status ? "text-primary" : "text-foreground"
                  )}
                >
                  {status === "resolved"
                    ? "Resolved"
                    : status === "temporary"
                    ? "Temporary"
                    : "Follow-up"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Follow-up Notes */}
        {formData.status === "follow_up" && (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Follow-up Notes</Text>
            <TextInput
              className={cn(
                "bg-surface rounded-xl p-4 text-base text-foreground border border-border",
                isReadOnly && "opacity-60"
              )}
              placeholder="Describe what follow-up is needed"
              placeholderTextColor={colors.muted}
              value={formData.followUpNotes || ""}
              onChangeText={(text) => setFormData({ ...formData, followUpNotes: text })}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!isReadOnly}
            />
          </View>
        )}

        {/* Action Buttons */}
        {!isReadOnly && (
          <View className="gap-3 mt-4">
            <TouchableOpacity
              className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
              onPress={handleSaveDraft}
              disabled={isSaving || upsertDraftMutation.isPending}
            >
              <Text className="text-center text-base font-semibold text-foreground">
                {isSaving || upsertDraftMutation.isPending ? "Saving..." : "Save Draft"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-primary rounded-2xl p-4 active:opacity-80"
              onPress={handleSubmit}
              disabled={isSaving || submitMutation.isPending}
            >
              <Text className="text-center text-base font-bold text-background">
                {isSaving || submitMutation.isPending ? "Submitting..." : "Submit Report"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submitted Note */}
        {isSubmitted && (
          <View className="bg-muted/10 rounded-xl p-4 mt-2">
            <Text className="text-sm text-muted text-center">
              This report has been submitted and cannot be edited.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
