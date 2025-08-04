"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  demandCreationSchema, 
  demandLineSchema,
  type DemandCreationInput,
  type DemandLineInput
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
  ChevronDown,
  Plus,
  Trash2,
  Copy
} from "lucide-react";
import BUDepartmentSelector from "./BUDepartmentSelector";
import ExpenseAccountSelector from "./ExpenseAccountSelector";
import { cn } from "@/lib/utils";

interface MultiLineDemandFormProps {
  onSuccess?: (data: DemandCreationInput) => void;
  onError?: (error: string) => void;
  initialData?: Partial<DemandCreationInput>;
  isSubmitting?: boolean;
  className?: string;
}

export default function MultiLineDemandForm({
  onSuccess,
  onError,
  initialData,
  isSubmitting = false,
  className
}: MultiLineDemandFormProps) {
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
      demandLines: [
        {
          itemDescription: "",
          quantity: 1,
          estimatedCost: 0,
          unitOfMeasure: "EA",
          specifications: "",
          supplierPreference: "",
        }
      ],
      justification: "",
      priorityLevel: "MEDIUM",
      expectedDeliveryDate: new Date().toISOString(),
      departmentSpecific: {},
      attachments: [],
      ...initialData,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "demandLines",
  });

  const watchedValues = watch();
  const selectedBU = watchedValues.bu;
  const userDepartment = session?.user?.department || session?.user?.centralDepartment || "DEFAULT";

  // Calculate total estimated cost
  const totalEstimatedCost = watchedValues.demandLines?.reduce((sum, line) => sum + (line.estimatedCost || 0), 0) || 0;

  // Console logging for debugging
  useEffect(() => {
    // Form state monitoring
  }, [watchedValues, errors, isValid, isDirty, totalEstimatedCost, fields.length, userDepartment, selectedBU]);

  const onSubmit = async (data: DemandCreationInput) => {
    // Form submission processing

    try {
      const response = await fetch('/api/demands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

              // API response processing

      if (!response.ok) {
        throw new Error(result.error || 'Không thể gửi yêu cầu');
      }

      if (!result.success) {
        throw new Error(result.error || 'Không thể gửi yêu cầu');
      }

      setHasUnsavedChanges(false);
      onSuccess?.(data);
      
              // Success processing
      
    } catch (error) {
              // Error handling
      onError?.(error instanceof Error ? error.message : "Không thể gửi yêu cầu");
    }
  };

  const handleBUDepartmentSelection = (data: {
    bu: string;
    department: string;
    account: number;
    approvalRoute: string | null;
  }) => {
    // BU/Department selection processing
    
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
    // Expense account selection processing
    
    setValue("expenseAccount", data.account);
    setValue("expenseDescription", data.description);
    setValue("expenseGLClass", data.glClass);
    setValue("expenseStockType", data.stockType);
    setValue("expenseOrderType", data.orderType);
  };

  const addDemandLine = () => {
    // Adding new demand line
    
    append({
      itemDescription: "",
      quantity: 1,
      estimatedCost: 0,
      unitOfMeasure: "EA",
      specifications: "",
      supplierPreference: "",
    });
  };

  const removeDemandLine = (index: number) => {
    // Removing demand line
    
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Form Header */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Biểu mẫu Yêu cầu Đa dòng</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-blue-600">
              Tổng: {totalEstimatedCost.toLocaleString('vi-VN')} VND
            </Badge>
            <Badge variant="outline">
              {fields.length} dòng
            </Badge>
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
            
            {/* Expense Account Selection */}
            <ExpenseAccountSelector
              selectedBU={selectedBU}
              onSelectionChange={handleExpenseAccountSelection}
            />

            {/* Delivery Date and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value).toISOString())}
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
          </CardContent>
        </Card>

        {/* Demand Lines */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Package className="h-5 w-5 text-gray-600" />
                  <span>Chi tiết Hàng hóa/Dịch vụ</span>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Thêm các mặt hàng hoặc dịch vụ bạn cần
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDemandLine}
                className="flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm dòng</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Dòng {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDemandLine(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Xóa
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Item Description */}
                  <div className="md:col-span-2 lg:col-span-2 space-y-1">
                    <Label className="text-sm font-medium text-gray-700">
                      Mô tả Hàng hóa/Dịch vụ *
                    </Label>
                    <Controller
                      name={`demandLines.${index}.itemDescription`}
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          placeholder="Mô tả hàng hóa hoặc dịch vụ..."
                          className="min-h-[60px]"
                        />
                      )}
                    />
                    {errors.demandLines?.[index]?.itemDescription && (
                      <p className="text-sm text-red-600">{errors.demandLines[index]?.itemDescription?.message}</p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700">
                      Số lượng *
                    </Label>
                    <Controller
                      name={`demandLines.${index}.quantity`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      )}
                    />
                    {errors.demandLines?.[index]?.quantity && (
                      <p className="text-sm text-red-600">{errors.demandLines[index]?.quantity?.message}</p>
                    )}
                  </div>

                  {/* Unit of Measure */}
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700">
                      Đơn vị
                    </Label>
                    <Controller
                      name={`demandLines.${index}.unitOfMeasure`}
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="EA">EA</option>
                          <option value="KG">KG</option>
                          <option value="L">L</option>
                          <option value="M">M</option>
                          <option value="PCS">PCS</option>
                          <option value="BOX">BOX</option>
                          <option value="SET">SET</option>
                          <option value="PACK">PACK</option>
                          <option value="TON">TON</option>
                          <option value="GAL">GAL</option>
                          <option value="FT">FT</option>
                          <option value="LB">LB</option>
                        </select>
                      )}
                    />
                  </div>

                  {/* Estimated Cost */}
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-gray-700">
                      Chi phí Ước tính (VND)
                    </Label>
                    <Controller
                      name={`demandLines.${index}.estimatedCost`}
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
                    {errors.demandLines?.[index]?.estimatedCost && (
                      <p className="text-sm text-red-600">{errors.demandLines[index]?.estimatedCost?.message}</p>
                    )}
                  </div>

                  {/* Specifications */}
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-sm font-medium text-gray-700">
                      Thông số Kỹ thuật
                    </Label>
                    <Controller
                      name={`demandLines.${index}.specifications`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="Thông số kỹ thuật (nếu có)..."
                        />
                      )}
                    />
                  </div>

                  {/* Supplier Preference */}
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-sm font-medium text-gray-700">
                      Nhà cung cấp Ưu tiên
                    </Label>
                    <Controller
                      name={`demandLines.${index}.supplierPreference`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="Nhà cung cấp ưu tiên (nếu có)..."
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}

            {errors.demandLines && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.demandLines.message}</p>
              </div>
            )}
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

        {/* Form Actions */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 sm:space-x-3">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => reset()}
                disabled={isSubmitting}
                size="sm"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Đặt lại Biểu mẫu
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