import type { Metadata } from "next";
import { ConfPage } from "@/components/contents/configuration/ConfPage";

export const metadata: Metadata = {
  title: "Thiết lập hệ thống - TrueSubmit",
  description: "Trình hướng dẫn cấu hình và thiết lập hệ thống TrueSubmit",
};

export default function ConfigurationPage() {
  return <ConfPage />;
}

