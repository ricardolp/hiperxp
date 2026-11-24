import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Analytics } from "./components/Analytics";
import { DocumentMeta } from "./components/DocumentMeta";
import { Layout } from "./components/Layout";
import {
  DatabaseIndexPage,
  DatabaseItemPage,
  DatabaseNpcPage,
  DatabaseQuestPage,
} from "./pages/DatabasePage";
import { DropDetailPage, DropsIndexPage } from "./pages/DropsPage";
import { HomePage } from "./pages/HomePage";
import { MapPage } from "./pages/MapPage";
import {
  QuestPostPage,
  QuestsIndexPage,
  QuestsPage,
} from "./pages/QuestsPage";

export default function App() {
  return (
    <BrowserRouter>
      <DocumentMeta />
      <Analytics />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="mapas/:slug" element={<MapPage />} />
          <Route path="mapas" element={<Navigate to="/mapas/cidade-da-paz" replace />} />
          <Route path="missoes/:mapSlug/:questSlug" element={<QuestPostPage />} />
          <Route path="missoes/:mapSlug" element={<QuestsPage />} />
          <Route path="missoes" element={<QuestsIndexPage />} />
          <Route path="database/itens/:itemId" element={<DatabaseItemPage />} />
          <Route path="database/npcs/:npcId" element={<DatabaseNpcPage />} />
          <Route path="database/missoes/:questId" element={<DatabaseQuestPage />} />
          <Route path="database" element={<DatabaseIndexPage />} />
          <Route path="simulador" element={<DropsIndexPage />} />
          <Route path="simulador/:slug" element={<DropDetailPage />} />
          <Route path="drops" element={<Navigate to="/simulador" replace />} />
          <Route path="drops/:slug" element={<Navigate to="/simulador" replace />} />
          <Route path="sobre" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
