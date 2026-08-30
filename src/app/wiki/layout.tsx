import "./wiki-mirror.css";
import { MigrationPageNotice } from "@/components/site/MigrationPageNotice";
import { lcPageContainerClass } from "@/components/site/lc-page-shell";

/** Перегляд вікі — публічний. */
export default function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className={lcPageContainerClass}>
        <MigrationPageNotice feature="wiki" />
      </div>
      {children}
    </>
  );
}
