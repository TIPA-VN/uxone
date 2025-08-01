"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  demandCreationSchema, 
  type DemandCreationInput 
} from "@/lib/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  Send, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Calendar,
  DollarSign,
  Package,
  FileText,
  AlertTriangle,
  Users,
  ChevronDown
} from "lucide-react";
import BUDepartmentSelector from "./BUDepartmentSelector";
import ExpenseAccountSelector from "./ExpenseAccountSelector";
import { cn } from "@/lib/utils";

interface DemandCreationFormProps {
  onSuccess?: (data: DemandCreationInput) => void;
  onError?: (error: string) => void;
  initialData?: Partial<DemandCreationInput>;
  isSubmitting?: boolean;
  className?: string;
}



// Department-specific field configurations
const departmentFields = {
  IS: {
    technicalSpecs: { label: "Technical Specifications", required: false },
    supplierPreference: { label: "Preferred Supplier", required: false },
    budgetCode: { label: "Budget Code", required: true },
    projectCode: { label: "Project Code", required: false },
    urgencyReason: { label: "Urgency Reason", required: false },
  },
  PROC: {
    technicalSpecs: { label: "Technical Specifications", required: false },
    supplierPreference: { label: "Preferred Supplier", required: true },
    budgetCode: { label: "Budget Code", required: true },
    projectCode: { label: "Project Code", required: false },
    urgencyReason: { label: "Urgency Reason", required: false },
  },
  // Add more departments as needed
  DEFAULT: {
    technicalSpecs: { label: "Technical Specifications", required: false },
    supplierPreference: { label: "Preferred Supplier", required: false },
    budgetCode: { label: "Budget Code", required: false },
    projectCode: { label: "Project Code", required: false },
    urgencyReason: { label: "Urgency Reason", required: false },
  },
};

export default function DemandCreationForm({
  onSuccess,
  onError,
  initialData,
  isSubmitting = false,
  className
}: DemandCreationFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty, isValid },
    reset,
  } = useForm<DemandCreationInput>({
    resolver: zodResolver(demandCreationSchema),
    defaultValues: {
      bu: "",
      department: "",
      account: 0,
      approvalRoute: null,
      expenseAccount: 0,
      expenseDescription: "",
      expenseGLClass: "",
      expenseStockType: "",
      expenseOrderType: "",
      itemDescription: "",
      quantity: 1,
      estimatedCost: 0,
      justification: "",
      priorityLevel: "MEDIUM",
      expectedDeliveryDate: new Date(),
      departmentSpecific: {},
      attachments: [],
      ...initialData,
    },
  });

  const watchedValues = watch();
  const selectedBU = watchedValues.bu;
  const userDepartment = session?.user?.department || session?.user?.centralDepartment || "DEFAULT";
  const departmentConfig = departmentFields[userDepartment as keyof typeof departmentFields] || departmentFields.DEFAULT;

  // Auto-save draft functionality
  const saveDraft = useCallback(async (data: Partial<DemandCreationInput>) => {
    try {
      setIsDraftSaving(true);
      const draftData = {
        ...data,
        savedAt: new Date().toISOString(),
        userId: session?.user?.id,
      };
      
      // Save to localStorage for now (can be replaced with API call)
      localStorage.setItem(`demand-draft-${session?.user?.id}`, JSON.stringify(draftData));
      
      setTimeout(() => setIsDraftSaving(false), 1000);
    } catch (error) {
      console.error("Error saving draft:", error);
      setIsDraftSaving(false);
    }
  }, [session?.user?.id]);

  // Auto-save on form changes
  useEffect(() => {
    if (isDirty && Object.keys(watchedValues).length > 0) {
      setHasUnsavedChanges(true);
      const timeoutId = setTimeout(() => {
        saveDraft(watchedValues);
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [watchedValues, isDirty, saveDraft]);

  // Navigation guard for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const onSubmit = async (data: DemandCreationInput) => {
    try {
      const response = await fetch('/api/demands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Không thể gửi yêu cầu');
      }

      if (!result.success) {
        throw new Error(result.error || 'Không thể gửi yêu cầu');
      }

      setHasUnsavedChanges(false);
      onSuccess?.(data);
      
      // Clear draft after successful submission
      localStorage.removeItem(`demand-draft-${session?.user?.id}`);
      
    } catch (error) {
      console.error("Error submitting demand:", error);
      onError?.(error instanceof Error ? error.message : "Không thể gửi yêu cầu");
    }
  };

  const handleReset = () => {
    if (hasUnsavedChanges) {
              if (window.confirm("Bạn có thay đổi chưa lưu. Bạn có chắc muốn đặt lại biểu mẫu?")) {
        reset();
        setHasUnsavedChanges(false);
        setAttachments([]);
      }
    } else {
      reset();
      setAttachments([]);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newAttachments = Array.from(files).map(file => file.name);
      setAttachments(prev => [...prev, ...newAttachments]);
      setValue("attachments", [...attachments, ...newAttachments]);
    }
  };

  const handleBUDepartmentSelection = (data: {
    bu: string;
    department: string;
    account: number;
    approvalRoute: string | null;
  }) => {
    setValue("bu", data.bu);
    setValue("department", data.department);
    setValue("account", data.account);
    setValue("approvalRoute", data.approvalRoute);
  };

  const handleExpenseAccountSelection = (data: {
    account: number;
    description: string;
    glClass: string;
    stockType: string;
    orderType: string;
  }) => {
    setValue("expenseAccount", data.account);
    setValue("expenseDescription", data.description);
    setValue("expenseGLClass", data.glClass);
    setValue("expenseStockType", data.stockType);
    setValue("expenseOrderType", data.orderType);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Form Header - Status Only */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Biểu mẫu Yêu cầu</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {isDraftSaving && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Đang lưu bản nháp...</span>
              </div>
            )}
            
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Thay đổi chưa lưu
              </Badge>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <FileText className="h-5 w-5 text-gray-600" />
              <span>Thông tin Cơ bản</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Cung cấp thông tin cần thiết cho yêu cầu của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* BU and Department Selection */}
            <BUDepartmentSelector
              onSelectionChange={handleBUDepartmentSelection}
            />
            
            {/* Error display for BU/Department fields */}
            {(errors.bu || errors.department || errors.account) && (
              <div className="space-y-1">
                {errors.bu && <p className="text-sm text-red-600">{errors.bu.message}</p>}
                {errors.department && <p className="text-sm text-red-600">{errors.department.message}</p>}
                {errors.account && <p className="text-sm text-red-600">{errors.account.message}</p>}
              </div>
            )}

            {/* Expense Account Selection - On its own row */}
            <ExpenseAccountSelector
              selectedBU={selectedBU}
              onSelectionChange={handleExpenseAccountSelection}
            />
            
            {/* Error display for Expense Account fields */}
            {(errors.expenseAccount || errors.expenseDescription || errors.expenseGLClass) && (
              <div className="space-y-1">
                {errors.expenseAccount && <p className="text-sm text-red-600">{errors.expenseAccount.message}</p>}
                {errors.expenseDescription && <p className="text-sm text-red-600">{errors.expenseDescription.message}</p>}
                {errors.expenseGLClass && <p className="text-sm text-red-600">{errors.expenseGLClass.message}</p>}
              </div>
            )}

            {/* Quantity, Estimated Cost, Delivery Date, and Priority - All on same row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                  Số lượng *
                </Label>
                <Controller
                  name="quantity"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      size={1}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  )}
                />
                {errors.quantity && (
                  <p className="text-sm text-red-600">{errors.quantity.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="estimatedCost" className="text-sm font-medium text-gray-700">
                  Chi phí Ước tính (VND)
                </Label>
                <Controller
                  name="estimatedCost"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        step="1000"
                        className="pl-10"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  )}
                />
                {errors.estimatedCost && (
                  <p className="text-sm text-red-600">{errors.estimatedCost.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="expectedDeliveryDate" className="text-sm font-medium text-gray-700">
                  Ngày Giao hàng Dự kiến *
                </Label>
                <Controller
                  name="expectedDeliveryDate"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="date"
                        className="pl-10"
                        value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  )}
                />
                {errors.expectedDeliveryDate && (
                  <p className="text-sm text-red-600">{errors.expectedDeliveryDate.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="priorityLevel" className="text-sm font-medium text-gray-700">
                  Mức độ Ưu tiên *
                </Label>
                <Controller
                  name="priorityLevel"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Chọn Mức độ Ưu tiên</option>
                      <option value="LOW">Thấp</option>
                      <option value="MEDIUM">Trung bình</option>
                      <option value="HIGH">Cao</option>
                      <option value="URGENT">Khẩn cấp</option>
                    </select>
                  )}
                />
                {errors.priorityLevel && (
                  <p className="text-sm text-red-600">{errors.priorityLevel.message}</p>
                )}
              </div>
            </div>

                        <div className="space-y-1">
              <Label htmlFor="itemDescription" className="text-sm font-medium text-gray-700">
                Mô tả Hàng hóa/Dịch vụ *
              </Label>
              <Controller
                name="itemDescription"
                control={control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    placeholder="Mô tả hàng hóa hoặc dịch vụ bạn cần..."
                    className="min-h-[80px]"
                  />
                )}
              />
              {errors.itemDescription && (
                <p className="text-sm text-red-600">{errors.itemDescription.message}</p>
              )}
            </div>


          </CardContent>
        </Card>

                {/* Justification */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <FileText className="h-5 w-5 text-gray-600" />
              <span>Lý do Yêu cầu</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Giải thích tại sao yêu cầu này cần thiết và sẽ mang lại lợi ích gì cho tổ chức
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              name="justification"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                                      placeholder="Cung cấp lý do chi tiết cho yêu cầu này..."
                  className="min-h-[120px]"
                />
              )}
            />
            {errors.justification && (
              <p className="mt-1 text-sm text-red-600">{errors.justification.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Department-Specific Fields */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Package className="h-5 w-5 text-gray-600" />
              <span>Thông tin Riêng Phòng ban</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Các trường thông tin riêng cho phòng ban của bạn ({userDepartment})
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(departmentConfig).map(([key, config]) => (
                <div key={key}>
                  <Label htmlFor={key} className="text-sm font-medium text-gray-700 mb-2 block">
                    {config.label} {config.required && "*"}
                  </Label>
                  <Controller
                    name={`departmentSpecific.${key}` as any}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder={`Enter ${config.label.toLowerCase()}...`}
                      />
                    )}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* File Attachments */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Upload className="h-5 w-5 text-gray-600" />
              <span>Tệp Đính kèm</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Tải lên các tài liệu hỗ trợ (tùy chọn)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file-upload" className="text-sm font-medium text-gray-700 mb-2 block">
                  Tải lên Tệp
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
              </div>

              {attachments.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Tệp Đã Đính kèm
                  </Label>
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <span className="text-sm text-gray-700">{file}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newAttachments = attachments.filter((_, i) => i !== index);
                            setAttachments(newAttachments);
                            setValue("attachments", newAttachments);
                          }}
                        >
                          Xóa
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

                {/* Form Actions */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isSubmitting}
                size="sm"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Đặt lại Biểu mẫu
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => saveDraft(watchedValues)}
                disabled={isDraftSaving || isSubmitting}
                size="sm"
              >
                {isDraftSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Lưu Bản nháp
                  </>
                )}
              </Button>
            </div>
            
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              size="sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Gửi Yêu cầu
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
} 