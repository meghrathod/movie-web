import { useCallback } from "react";

import { CenterContainer } from "@/components/layout/ThinContainer";
import { useSettingsExport } from "@/hooks/useSettingsExport";
import { MinimalPageLayout } from "@/pages/layouts/MinimalPageLayout";
import { PageTitle } from "@/pages/parts/util/PageTitle";

export function MigrationDirectPage() {
  const exportSettings = useSettingsExport();

  const doDownload = useCallback(() => {
    const data = exportSettings(false);
    console.log(data);
  }, [exportSettings]);

  return (
    <MinimalPageLayout>
      <PageTitle subpage k="global.pages.migration" />
      <CenterContainer>
        <button onClick={doDownload} type="button">
          Hello
        </button>
      </CenterContainer>
    </MinimalPageLayout>
  );
}
