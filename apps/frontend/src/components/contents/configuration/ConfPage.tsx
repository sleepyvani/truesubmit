"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Check, Database, User, Settings, ShieldAlert, ArrowRight, ArrowLeft, CheckCircle2, Terminal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";

export function ConfPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [maxCompletedStep, setMaxCompletedStep] = useState(0);

  // Step 2: DB Check State
  const [dbCheckStatus, setDbCheckStatus] = useState<"idle" | "checking" | "success" | "no_tables" | "error">("idle");
  const [dbMessage, setDbMessage] = useState("");
  const [migrateStatus, setMigrateStatus] = useState<"idle" | "migrating" | "success" | "error">("idle");
  const [migrateMessage, setMigrateMessage] = useState("");

  // Step 2: NATS Check State
  const [natsCheckStatus, setNatsCheckStatus] = useState<"idle" | "checking" | "success" | "error">("idle");
  const [natsMessage, setNatsMessage] = useState("");

  // Installed tables dialog state
  const [tablesList, setTablesList] = useState<string[]>([]);
  const [isTablesModalOpen, setIsTablesModalOpen] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [tablesError, setTablesError] = useState("");

  // Step 3: Admin Form State
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminConfirmPassword, setAdminConfirmPassword] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminStatus, setAdminStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [adminMessage, setAdminMessage] = useState("");

  // Step 4: System Config State
  const [systemName, setSystemName] = useState("TrueSubmit PTIT");
  const [allowedLanguages, setAllowedLanguages] = useState<string[]>(["c_cpp", "java", "python"]);
  const [timeLimit, setTimeLimit] = useState(1000);
  const [memoryLimit, setMemoryLimit] = useState(256);
  const [configStatus, setConfigStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [configMessage, setConfigMessage] = useState("");

  // Step 5: Finalization State
  const [activationStatus, setActivationStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [activationMessage, setActivationMessage] = useState("");

  // Step definition array
  const steps = [
    { id: 1, label: "Bước 1", title: "Giới thiệu", desc: "Tổng quan về quy trình thiết lập" },
    { id: 2, label: "Bước 2", title: "Kiểm tra Database", desc: "Xác minh kết nối cơ sở dữ liệu" },
    { id: 3, label: "Bước 3", title: "Tài khoản quản trị", desc: "Tạo tài khoản Super Admin ban đầu" },
    { id: 4, label: "Bước 4", title: "Cấu hình hệ thống", desc: "Đặt cấu hình và giới hạn tài nguyên" },
    { id: 5, label: "Bước 5", title: "Hoàn thành", desc: "Xác nhận kích hoạt hệ thống" },
  ];

  // Database check trigger
  const handleCheckDb = async () => {
    setDbCheckStatus("checking");
    setDbMessage("");
    try {
      const result = await trpc.configuration.checkDb.mutate();
      if (result.success) {
        if (result.tablesExist) {
          setDbCheckStatus("success");
          setDbMessage(result.message || "Kết nối database thành công và cấu trúc bảng đã sẵn sàng.");
        } else {
          setDbCheckStatus("no_tables");
          setDbMessage(result.message || "Kết nối database thành công nhưng cấu trúc bảng chưa được khởi tạo (chưa migrate).");
        }
      } else {
        setDbCheckStatus("error");
        setDbMessage(result.message || "Kết nối cơ sở dữ liệu thất bại.");
      }
    } catch (err: any) {
      setDbCheckStatus("error");
      setDbMessage(err?.message || "Đã xảy ra lỗi không xác định khi kết nối đến backend.");
    }
  };

  // Database migration trigger
  const handleMigrateDb = async () => {
    setMigrateStatus("migrating");
    setMigrateMessage("");
    try {
      const result = await trpc.configuration.migrateDb.mutate();
      if (result.success) {
        setMigrateStatus("success");
        setMigrateMessage(result.message || "Chạy migration và seeding dữ liệu thành công.");
        // Recheck connection to set status to success
        await handleCheckDb();
      } else {
        setMigrateStatus("error");
        setMigrateMessage(result.message || "Lỗi khi chạy migration.");
      }
    } catch (err: any) {
      setMigrateStatus("error");
      setMigrateMessage(err?.message || "Đã xảy ra lỗi không xác định khi chạy migration.");
    }
  };

  // Fetch installed tables list
  const handleFetchTables = async () => {
    setIsLoadingTables(true);
    setTablesError("");
    try {
      const result = await trpc.configuration.getDbTables.query();
      if (result.success) {
        setTablesList(result.tables || []);
      } else {
        setTablesError(result.message || "Không thể lấy danh sách bảng.");
      }
    } catch (err: any) {
      setTablesError(err?.message || "Lỗi kết nối khi lấy danh sách bảng.");
    } finally {
      setIsLoadingTables(false);
    }
  };

  // NATS check trigger
  const handleCheckNats = async () => {
    setNatsCheckStatus("checking");
    setNatsMessage("");
    try {
      const result = await trpc.configuration.checkNats.mutate();
      if (result.success) {
        setNatsCheckStatus("success");
        setNatsMessage(result.message);
      } else {
        setNatsCheckStatus("error");
        setNatsMessage(result.message);
      }
    } catch (err: any) {
      setNatsCheckStatus("error");
      setNatsMessage(err?.message || "Đã xảy ra lỗi không xác định khi kết nối đến NATS.");
    }
  };

  // Admin creation trigger
  const handleSaveAdmin = async () => {
    if (!adminEmail || !adminPassword || !adminName) {
      setAdminStatus("error");
      setAdminMessage("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }
    if (adminPassword.length < 6) {
      setAdminStatus("error");
      setAdminMessage("Mật khẩu phải chứa ít nhất 6 ký tự.");
      return;
    }
    if (adminPassword !== adminConfirmPassword) {
      setAdminStatus("error");
      setAdminMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setAdminStatus("submitting");
    setAdminMessage("");
    try {
      const result = await trpc.configuration.setupAdmin.mutate({
        email: adminEmail,
        password: adminPassword,
        displayName: adminName,
      });
      if (result.success) {
        setAdminStatus("success");
        setAdminMessage(result.message);
        setMaxCompletedStep(Math.max(maxCompletedStep, 3));
        // Move to next step automatically on success
        setTimeout(() => {
          setCurrentStep(4);
        }, 800);
      } else {
        setAdminStatus("error");
        setAdminMessage(result.message);
      }
    } catch (err: any) {
      setAdminStatus("error");
      setAdminMessage(err?.message || "Lỗi tạo tài khoản admin.");
    }
  };

  // System settings saving trigger
  const handleSaveConfig = async () => {
    if (!systemName) {
      setConfigStatus("error");
      setConfigMessage("Tên hệ thống không được để trống.");
      return;
    }
    if (allowedLanguages.length === 0) {
      setConfigStatus("error");
      setConfigMessage("Vui lòng chọn ít nhất một ngôn ngữ lập trình được hỗ trợ.");
      return;
    }

    setConfigStatus("saving");
    setConfigMessage("");
    try {
      const result = await trpc.configuration.saveSystemConfig.mutate({
        systemName,
        allowedLanguages,
        sandboxTimeLimit: timeLimit,
        sandboxMemoryLimit: memoryLimit,
      });
      if (result.success) {
        setConfigStatus("success");
        setConfigMessage(result.message);
        setMaxCompletedStep(Math.max(maxCompletedStep, 4));
        setTimeout(() => {
          setCurrentStep(5);
        }, 800);
      } else {
        setConfigStatus("error");
        setConfigMessage(result.message);
      }
    } catch (err: any) {
      setConfigStatus("error");
      setConfigMessage(err?.message || "Lỗi cấu hình hệ thống.");
    }
  };

  // Final activation trigger
  const handleActivateSystem = async () => {
    setActivationStatus("submitting");
    setActivationMessage("");
    try {
      const result = await trpc.configuration.completeSetup.mutate();
      if (result.success) {
        setActivationStatus("success");
        setActivationMessage("Hệ thống kích hoạt thành công! Đang chuyển hướng về trang chủ...");
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        setActivationStatus("error");
        setActivationMessage(result.message);
      }
    } catch (err: any) {
      setActivationStatus("error");
      setActivationMessage(err?.message || "Lỗi kích hoạt hệ thống.");
    }
  };

  const handleLanguageToggle = (lang: string) => {
    if (allowedLanguages.includes(lang)) {
      setAllowedLanguages(allowedLanguages.filter((l) => l !== lang));
    } else {
      setAllowedLanguages([...allowedLanguages, lang]);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      setMaxCompletedStep(Math.max(maxCompletedStep, 1));
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (dbCheckStatus === "success" && natsCheckStatus === "success") {
        setMaxCompletedStep(Math.max(maxCompletedStep, 2));
        setCurrentStep(3);
      } else {
        if (dbCheckStatus !== "success") handleCheckDb();
        if (natsCheckStatus !== "success") handleCheckNats();
      }
    } else if (currentStep === 3) {
      handleSaveAdmin();
    } else if (currentStep === 4) {
      handleSaveConfig();
    } else if (currentStep === 5) {
      handleActivateSystem();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    if (stepId <= maxCompletedStep + 1) {
      setCurrentStep(stepId);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-background text-foreground font-sans">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col">
        <div className="border-l border-r border-dashed border-primary/20 flex-1 flex flex-col">
          
          {/* Header Section */}
          <header className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-vanixjnk flex items-center justify-center text-primary-foreground font-bold shadow-md shadow-vanixjnk/20">
                TS
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                TrueSubmit
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/")}
              className="border-dashed border-primary/20 hover:border-vanixjnk hover:text-vanixjnk transition-all duration-200"
            >
              Quay lại Dashboard
            </Button>
          </header>

          {/* Horizontal separator */}
          <div className="border-b border-dashed border-primary/20 w-full" />

          {/* Dynamic diagonal stripe divider */}
          <div className="relative w-full border-b border-dashed border-primary/20 overflow-hidden text-primary/10 h-6">
            <div
              className="absolute inset-y-0 left-[-100vw] w-[300vw]"
              style={{
                backgroundImage: "repeating-linear-gradient(45deg, currentColor, currentColor 1px, transparent 1px, transparent 10px)"
              }}
            />
          </div>

          {/* Content Layout - Two Columns Grid */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 min-h-[calc(100vh-140px)]">
            
            {/* Left Column: Vertical Stepper */}
            <aside className="md:col-span-1 border-r border-dashed border-primary/20 p-6 flex flex-col">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6">
                Thiết lập hệ thống
              </h2>
              
              <nav className="flex flex-col relative space-y-8 pl-1">
                {/* Stepper Vertical Connector Line */}
                <div className="absolute left-[20px] top-2 bottom-2 w-0.5 bg-border z-0" />

                {steps.map((step) => {
                  const isCurrent = currentStep === step.id;
                  const isCompleted = step.id < currentStep;
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => handleStepClick(step.id)}
                      disabled={step.id > maxCompletedStep + 1}
                      className="group flex items-start gap-4 text-left transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="relative flex items-center justify-center z-10">
                        {isCompleted ? (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-medium border text-sm transition-all duration-300 relative overflow-hidden bg-background text-emerald-500 border-emerald-500/25 ring-4 ring-emerald-500/5">
                            <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
                            <Check className="w-4 h-4 z-10" />
                          </div>
                        ) : isCurrent ? (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-medium border text-sm transition-all duration-300 relative overflow-hidden bg-emerald-500 text-white border-emerald-500 ring-4 ring-emerald-500/15">
                            {step.id}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-medium border text-sm transition-all duration-300 relative overflow-hidden bg-background text-muted-foreground border-border">
                            {step.id}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col min-w-0 pt-0.5">
                        <span className={`text-[11px] font-semibold uppercase tracking-wider transition-colors duration-300 ${
                          isCurrent
                            ? 'text-emerald-500 font-semibold'
                            : isCompleted
                            ? 'text-emerald-500 font-medium'
                            : 'text-muted-foreground'
                        }`}>
                          {step.label}
                        </span>
                        <span className={`text-sm leading-none mt-1 truncate transition-colors duration-300 ${
                          isCurrent ? "text-foreground font-bold" : "text-muted-foreground group-hover:text-foreground"
                        }`}>
                          {step.title}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Right Column: Main Configuration Workspace */}
            <main className="md:col-span-3 p-6 sm:p-8 flex flex-col justify-between bg-card/10">
              <div className="space-y-6">
                
                {/* Current step heading */}
                <div className="border-b border-dashed border-primary/20 pb-4">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {steps[currentStep - 1]?.title || ""}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    {steps[currentStep - 1]?.desc || ""}
                  </p>
                </div>

                {/* Step contents mapping */}
                <div className="space-y-6">
                  
                  {/* STEP 1: Introduction */}
                  {currentStep === 1 && (
                    <div className="space-y-6 animate-fadeIn">
                      <Card className="bg-card/40 border-dashed border-primary/20 shadow-none">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg text-vanixjnk">
                            <Terminal className="w-5 h-5" />
                            Chào mừng đến với TrueSubmit
                          </CardTitle>
                          <CardDescription>
                            Hệ thống tự động chấm bài thi và quản lý học tập tối ưu.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-muted-foreground">
                          <p>
                            TrueSubmit giúp giảng viên và quản trị viên dễ dàng tạo, thiết lập đề thi lập trình, chấm điểm tự động và trực quan hóa thứ hạng thông qua Leaderboard thời gian thực.
                          </p>
                          <p>
                            Trình hướng dẫn thiết lập này sẽ giúp bạn cấu hình các thành phần cơ bản để vận hành hệ thống một cách nhanh chóng nhất.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-card/40 border-dashed border-primary/20 shadow-none">
                        <CardHeader>
                          <CardTitle className="text-sm font-semibold">
                            Các nội dung sẽ cấu hình:
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2.5 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-vanixjnk mt-1.5 flex-shrink-0" />
                              <span>Kết nối và thiết lập cấu trúc cơ sở dữ liệu PostgreSQL.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-vanixjnk mt-1.5 flex-shrink-0" />
                              <span>Khởi tạo tài khoản Super Admin quản lý tối cao.</span>
                            </li>
                            <li className="flex items-start gap-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-vanixjnk mt-1.5 flex-shrink-0" />
                              <span>Cấu hình giới hạn hiệu năng của Sandbox chấm bài (Time limits, Memory limits).</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* STEP 2: Database and NATS Connection Checks */}
                  {currentStep === 2 && (
                    <div className="space-y-6 animate-fadeIn">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* PostgreSQL Database Connection */}
                        <Card className="bg-card/40 border-dashed border-primary/20 shadow-none flex flex-col justify-between">
                          <div>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-lg">
                                <Database className="w-5 h-5 text-emerald-500" />
                                Cơ sở dữ liệu PostgreSQL
                              </CardTitle>
                              <CardDescription>
                                TrueSubmit sử dụng cơ sở dữ liệu PostgreSQL để lưu trữ thông tin kỳ thi, đề bài và kết quả nộp bài của sinh viên.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="flex flex-col gap-2">
                                <Label>Trạng thái kết nối</Label>
                                <div className="flex items-center gap-2.5 py-1.5 px-3 rounded-lg border border-primary/10 bg-primary/5 text-sm font-medium w-fit">
                                  <div className={`w-2.5 h-2.5 rounded-full ${
                                    dbCheckStatus === "success" ? "bg-emerald-500 animate-pulse" :
                                    dbCheckStatus === "no_tables" ? "bg-amber-500 animate-pulse" :
                                    dbCheckStatus === "error" ? "bg-rose-500 animate-pulse" :
                                    dbCheckStatus === "checking" ? "bg-amber-500 animate-pulse" :
                                    "bg-zinc-400"
                                  }`} />
                                  <span>
                                    {dbCheckStatus === "success" && "Đã kết nối & cấu trúc bảng hợp lệ"}
                                    {dbCheckStatus === "no_tables" && "Kết nối thành công (chưa có bảng)"}
                                    {dbCheckStatus === "error" && "Kết nối thất bại"}
                                    {dbCheckStatus === "checking" && "Đang kiểm tra..."}
                                    {dbCheckStatus === "idle" && "Chưa kiểm tra"}
                                  </span>
                                </div>
                              </div>

                              {dbCheckStatus === "no_tables" && (
                                <div className="p-4 rounded-lg border border-amber-500/25 bg-amber-500/10 text-xs text-amber-600 dark:text-amber-400 flex flex-col gap-3">
                                  <div className="flex items-start gap-2.5">
                                    <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <div>
                                      Cơ sở dữ liệu đang trống. Bạn cần chạy Migration để khởi tạo cấu trúc các bảng và dữ liệu vai trò mặc định của TrueSubmit.
                                    </div>
                                  </div>
                                  <Button
                                    onClick={handleMigrateDb}
                                    disabled={migrateStatus === "migrating"}
                                    className="w-full bg-amber-600 text-white hover:bg-amber-500 transition-all text-xs font-semibold"
                                  >
                                    {migrateStatus === "migrating" ? "Đang chạy Migration..." : "Migrate Database"}
                                  </Button>
                                </div>
                              )}

                              {migrateMessage && migrateStatus === "error" && (
                                <div className="p-4 rounded-lg border border-rose-500/25 bg-rose-500/10 text-xs text-rose-500 flex items-start gap-2.5 mt-2">
                                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-semibold">Lỗi Migration: </span>
                                    {migrateMessage}
                                  </div>
                                </div>
                              )}

                              {dbMessage && (
                                <div className={`p-4 rounded-lg border text-xs flex items-start gap-2.5 mt-2 ${
                                  dbCheckStatus === "success" 
                                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400" 
                                    : dbCheckStatus === "no_tables"
                                    ? "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400"
                                    : "bg-rose-500/10 border-rose-500/25 text-rose-500 dark:text-rose-400"
                                }`}>
                                  {dbCheckStatus === "success" ? (
                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  ) : (
                                    <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  )}
                                  <div>
                                    <span className="font-semibold">
                                      {dbCheckStatus === "success" ? "Thành công: " : "Chi tiết: "}
                                    </span>
                                    {dbMessage}
                                  </div>
                                </div>
                              )}

                              {dbCheckStatus === "success" && (
                                <div className="mt-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setIsTablesModalOpen(true);
                                      handleFetchTables();
                                    }}
                                    className="w-full text-xs font-medium border-dashed border-emerald-500/25 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-500 gap-1.5"
                                  >
                                    <Icon icon="solar:database-line-duotone" className="size-4" />
                                    Xem các bảng đã cài đặt
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </div>
                          <div className="px-6 pb-6 pt-2">
                            <Button 
                              onClick={handleCheckDb} 
                              disabled={dbCheckStatus === "checking"}
                              className="w-full font-medium"
                              variant={dbCheckStatus === "success" ? "outline" : "default"}
                            >
                              {dbCheckStatus === "checking" ? "Đang kiểm tra..." : "Kiểm tra kết nối DB"}
                            </Button>
                          </div>
                        </Card>

                        {/* NATS Message Broker Connection */}
                        <Card className="bg-card/40 border-dashed border-primary/20 shadow-none flex flex-col justify-between">
                          <div>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-lg">
                                <Terminal className="w-5 h-5 text-sky-500" />
                                NATS Messaging System
                              </CardTitle>
                              <CardDescription>
                                Hệ thống hàng đợi tin nhắn chịu trách nhiệm điều phối bài nộp cho các Sandbox chấm điểm từ xa.
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="flex flex-col gap-2">
                                <Label>Trạng thái kết nối</Label>
                                <div className="flex items-center gap-2.5 py-1.5 px-3 rounded-lg border border-primary/10 bg-primary/5 text-sm font-medium w-fit">
                                  <div className={`w-2.5 h-2.5 rounded-full ${
                                    natsCheckStatus === "success" ? "bg-emerald-500 animate-pulse" :
                                    natsCheckStatus === "error" ? "bg-rose-500 animate-pulse" :
                                    natsCheckStatus === "checking" ? "bg-amber-500 animate-pulse" :
                                    "bg-zinc-400"
                                  }`} />
                                  <span>
                                    {natsCheckStatus === "success" && "Đã kết nối NATS"}
                                    {natsCheckStatus === "error" && "Không thể kết nối NATS"}
                                    {natsCheckStatus === "checking" && "Đang kiểm tra..."}
                                    {natsCheckStatus === "idle" && "Chưa kiểm tra"}
                                  </span>
                                </div>
                              </div>

                              {natsMessage && (
                                <div className={`p-4 rounded-lg border text-xs flex items-start gap-2.5 mt-2 ${
                                  natsCheckStatus === "success" 
                                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400" 
                                    : "bg-rose-500/10 border-rose-500/25 text-rose-500 dark:text-rose-400"
                                }`}>
                                  {natsCheckStatus === "success" ? (
                                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  ) : (
                                    <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                  )}
                                  <div>
                                    <span className="font-semibold">
                                      {natsCheckStatus === "success" ? "Thành công: " : "Lỗi: "}
                                    </span>
                                    {natsMessage}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </div>
                          <div className="px-6 pb-6 pt-2">
                            <Button 
                              onClick={handleCheckNats} 
                              disabled={natsCheckStatus === "checking"}
                              className="w-full font-medium"
                              variant={natsCheckStatus === "success" ? "outline" : "default"}
                            >
                              {natsCheckStatus === "checking" ? "Đang kiểm tra..." : "Kiểm tra kết nối NATS"}
                            </Button>
                          </div>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Admin Setup */}
                  {currentStep === 3 && (
                    <div className="space-y-6 animate-fadeIn">
                      <Card className="bg-card/40 border-dashed border-primary/20 shadow-none">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <User className="w-5 h-5 text-vanixjnk" />
                            Khởi tạo tài khoản Super Admin
                          </CardTitle>
                          <CardDescription>
                            Tài khoản này có quyền tối cao (chỉnh sửa hệ thống, quản lý tài nguyên và cấu hình sandbox).
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <Label htmlFor="admin-name">Họ và tên <span className="text-destructive">*</span></Label>
                              <Input
                                id="admin-name"
                                value={adminName}
                                onChange={(e) => setAdminName(e.target.value)}
                                placeholder="Nguyễn Văn A"
                                disabled={adminStatus === "submitting" || adminStatus === "success"}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <Label htmlFor="admin-email">Email quản trị <span className="text-destructive">*</span></Label>
                              <Input
                                id="admin-email"
                                type="email"
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                                placeholder="admin@truesubmit.edu.vn"
                                disabled={adminStatus === "submitting" || adminStatus === "success"}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <Label htmlFor="admin-pass">Mật khẩu khởi tạo <span className="text-destructive">*</span></Label>
                              <Input
                                id="admin-pass"
                                type="password"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                placeholder="••••••••"
                                disabled={adminStatus === "submitting" || adminStatus === "success"}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <Label htmlFor="admin-confirm">Xác nhận mật khẩu <span className="text-destructive">*</span></Label>
                              <Input
                                id="admin-confirm"
                                type="password"
                                value={adminConfirmPassword}
                                onChange={(e) => setAdminConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                disabled={adminStatus === "submitting" || adminStatus === "success"}
                              />
                            </div>
                          </div>

                          {/* Contextual alert */}
                          {adminMessage && (
                            <div className={`p-4 rounded-lg border text-sm flex items-start gap-3 mt-4 ${
                              adminStatus === "success" 
                                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400" 
                                : "bg-rose-500/10 border-rose-500/25 text-rose-500 dark:text-rose-400"
                            }`}>
                              {adminStatus === "success" ? (
                                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                              ) : (
                                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                              )}
                              <div>{adminMessage}</div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* STEP 4: System Configurations */}
                  {currentStep === 4 && (
                    <div className="space-y-6 animate-fadeIn">
                      <Card className="bg-card/40 border-dashed border-primary/20 shadow-none">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Settings className="w-5 h-5 text-vanixjnk" />
                            Cấu hình tham số hệ thống
                          </CardTitle>
                          <CardDescription>
                            Tùy chỉnh thông tin hiển thị cơ bản của TrueSubmit.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex flex-col gap-1.5">
                            <Label htmlFor="system-name">Tên hệ thống hiển thị</Label>
                            <Input
                              id="system-name"
                              value={systemName}
                              onChange={(e) => setSystemName(e.target.value)}
                              placeholder="TrueSubmit PTIT"
                              disabled={configStatus === "saving" || configStatus === "success"}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-card/40 border-dashed border-primary/20 shadow-none">
                        <CardHeader>
                          <CardTitle className="text-sm font-semibold">
                            Ngôn ngữ lập trình hỗ trợ chấm điểm
                          </CardTitle>
                          <CardDescription>
                            Lựa chọn các ngôn ngữ mà sinh viên được phép nộp bài.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                              { key: "c_cpp", label: "C / C++ (GCC)" },
                              { key: "java", label: "Java (OpenJDK)" },
                              { key: "python", label: "Python 3" },
                              { key: "golang", label: "Go (Golang)" },
                              { key: "csharp", label: "C# (.NET)" },
                            ].map((lang) => {
                              const isChecked = allowedLanguages.includes(lang.key);
                              return (
                                <button
                                  key={lang.key}
                                  type="button"
                                  onClick={() => handleLanguageToggle(lang.key)}
                                  disabled={configStatus === "saving" || configStatus === "success"}
                                  className={`flex items-center gap-2.5 py-2 px-3 rounded-lg border text-sm font-medium text-left transition-all ${
                                    isChecked
                                      ? "text-vanixjnk bg-vanixjnk/10 border-vanixjnk/30"
                                      : "border-border hover:border-primary/20 bg-muted/40"
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                    isChecked ? "bg-vanixjnk border-vanixjnk text-primary-foreground" : "border-muted-foreground/30"
                                  }`}>
                                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                  <span>{lang.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-card/40 border-dashed border-primary/20 shadow-none">
                        <CardHeader>
                          <CardTitle className="text-sm font-semibold">
                            Giới hạn an toàn Sandbox mặc định
                          </CardTitle>
                          <CardDescription>
                            Giới hạn tài nguyên để bảo vệ Golang Worker Sandbox tránh rò rỉ bộ nhớ hoặc vòng lặp vô hạn.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <Label htmlFor="time-limit">Giới hạn thời gian chạy (ms)</Label>
                            <Input
                              id="time-limit"
                              type="number"
                              value={timeLimit}
                              onChange={(e) => setTimeLimit(Number(e.target.value))}
                              min={100}
                              disabled={configStatus === "saving" || configStatus === "success"}
                            />
                            <span className="text-[11px] text-muted-foreground">Mặc định: 1000ms (1 giây).</span>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <Label htmlFor="mem-limit">Giới hạn bộ nhớ RAM (MB)</Label>
                            <Input
                              id="mem-limit"
                              type="number"
                              value={memoryLimit}
                              onChange={(e) => setMemoryLimit(Number(e.target.value))}
                              min={16}
                              disabled={configStatus === "saving" || configStatus === "success"}
                            />
                            <span className="text-[11px] text-muted-foreground">Mặc định: 256MB.</span>
                          </div>

                          {configMessage && (
                            <div className={`col-span-1 sm:col-span-2 p-4 rounded-lg border text-sm flex items-start gap-3 mt-2 ${
                              configStatus === "success" 
                                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400" 
                                : "bg-rose-500/10 border-rose-500/25 text-rose-500 dark:text-rose-400"
                            }`}>
                              {configStatus === "success" ? (
                                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                              ) : (
                                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                              )}
                              <div>{configMessage}</div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* STEP 5: Final Review & Confirmation */}
                  {currentStep === 5 && (
                    <div className="space-y-6 animate-fadeIn">
                      <Card className="bg-card/40 border-dashed border-primary/20 shadow-none">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg text-emerald-500">
                            <CheckCircle2 className="w-5 h-5" />
                            Xác nhận hoàn thành thiết lập
                          </CardTitle>
                          <CardDescription>
                            Vui lòng kiểm tra lại thông tin cấu hình trước khi kích hoạt hệ thống TrueSubmit.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="rounded-lg border border-primary/10 bg-primary/5 p-4 text-sm divide-y divide-primary/10">
                            <div className="grid grid-cols-3 py-2">
                              <span className="text-muted-foreground font-medium">Database status:</span>
                              <span className="col-span-2 text-foreground font-semibold text-emerald-500">Đã sẵn sàng</span>
                            </div>
                            <div className="grid grid-cols-3 py-2">
                              <span className="text-muted-foreground font-medium">Họ tên Super Admin:</span>
                              <span className="col-span-2 text-foreground font-semibold">{adminName}</span>
                            </div>
                            <div className="grid grid-cols-3 py-2">
                              <span className="text-muted-foreground font-medium">Email quản trị:</span>
                              <span className="col-span-2 text-foreground font-semibold">{adminEmail}</span>
                            </div>
                            <div className="grid grid-cols-3 py-2">
                              <span className="text-muted-foreground font-medium">Tên hệ thống:</span>
                              <span className="col-span-2 text-foreground font-semibold">{systemName}</span>
                            </div>
                            <div className="grid grid-cols-3 py-2">
                              <span className="text-muted-foreground font-medium">Ngôn ngữ kích hoạt:</span>
                              <span className="col-span-2 text-foreground font-semibold">
                                {allowedLanguages.map(l => l.toUpperCase().replace("_", "/")).join(", ")}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 py-2">
                              <span className="text-muted-foreground font-medium">Sandbox Limits:</span>
                              <span className="col-span-2 text-foreground font-semibold">
                                {timeLimit}ms / {memoryLimit}MB
                              </span>
                            </div>
                          </div>

                          {activationMessage && (
                            <div className={`p-4 rounded-lg border text-sm flex items-start gap-3 mt-4 ${
                              activationStatus === "success" 
                                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400" 
                                : "bg-rose-500/10 border-rose-500/25 text-rose-500 dark:text-rose-400"
                            }`}>
                              {activationStatus === "success" ? (
                                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 animate-bounce" />
                              ) : (
                                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                              )}
                              <div>{activationMessage}</div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                </div>
              </div>

              {/* Steps footer navigation panel (custom manual container to avoid CardFooter block) */}
              <div className="mt-8 border-t border-dashed border-primary/20 pt-6 flex items-center justify-between">
                <div>
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 1 || activationStatus === "success"}
                    className="border-dashed border-primary/20 hover:border-vanixjnk hover:text-vanixjnk"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại
                  </Button>
                </div>

                <div>
                  {currentStep === 5 ? (
                    <Button 
                      onClick={handleActivateSystem}
                      disabled={activationStatus === "submitting" || activationStatus === "success"}
                      className="bg-emerald-600 text-white hover:bg-emerald-500 transition-all font-semibold"
                    >
                      {activationStatus === "submitting" ? "Đang kích hoạt..." : "Kích hoạt hệ thống"}
                      <Check className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleNext}
                      disabled={
                        (currentStep === 2 && (dbCheckStatus !== "success" || natsCheckStatus !== "success")) ||
                        (currentStep === 3 && adminStatus === "submitting") ||
                        (currentStep === 4 && configStatus === "saving")
                      }
                      className="bg-vanixjnk hover:bg-vanixjnk/90 text-primary-foreground font-semibold shadow-md shadow-vanixjnk/25"
                    >
                      {currentStep === 2 && (dbCheckStatus !== "success" || natsCheckStatus !== "success") ? "Kiểm tra kết nối" : "Tiếp tục"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>

            </main>
          </div>
          
        </div>
      </div>

      <Dialog open={isTablesModalOpen} onOpenChange={setIsTablesModalOpen}>
        <DialogContent className="sm:max-w-md text-foreground">
          <DialogHeader className="flex flex-col items-center justify-center text-center">
            <div className="size-12 rounded-xl bg-vanixjnk/10 border border-vanixjnk/25 text-vanixjnk flex items-center justify-center mb-3">
              <Icon icon="solar:database-line-duotone" className="size-6 text-vanixjnk" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              Cấu trúc bảng đã khởi tạo
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mt-1">
              Danh sách các bảng trong schema public của cơ sở dữ liệu TrueSubmit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-2">
            {isLoadingTables ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2.5">
                <Icon icon="solar:restart-line-duotone" className="w-6 h-6 text-vanixjnk animate-spin" />
                <span className="text-xs text-muted-foreground">Đang tải danh sách bảng...</span>
              </div>
            ) : tablesError ? (
              <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs flex items-start gap-2">
                <Icon icon="solar:danger-triangle-line-duotone" className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                <span>{tablesError}</span>
              </div>
            ) : tablesList.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                Không tìm thấy bảng nào được cài đặt.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1.5">
                {tablesList.map((tableName) => (
                  <div 
                    key={tableName} 
                    className="flex items-center justify-between py-2 px-3 rounded-md bg-card border border-primary/10 hover:bg-vanixjnk/5 transition-colors text-xs font-mono text-muted-foreground/80"
                  >
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Icon icon="solar:round-alt-arrow-right-line-duotone" className="size-4 text-emerald-500" />
                      {tableName}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 uppercase font-sans">table</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t border-dashed border-primary/10 pt-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsTablesModalOpen(false)}
              className="text-xs font-semibold"
            >
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
