import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import WritePage from './pages/WritePage'
import ArticleDetailPage from './pages/ArticleDetailPage'
import AdminPage from './pages/AdminPage'
import SchedulePage from './pages/SchedulePage'
import ExpensePage from './pages/ExpensePage'
import MembersPage from './pages/MembersPage'
import ZoomPage from './pages/ZoomPage'
import PhotosPage from './pages/PhotosPage'
import FileUploadPage from './pages/FileUploadPage'
import FileManagementPage from './pages/FileManagementPage'
import PresentationPage from './pages/PresentationPage'
import PresentationEditorPage from './pages/PresentationEditorPage'
import ResetPage from './pages/ResetPage'

function App() {
  return (
    <Routes>
      <Route path="/reset" element={<ResetPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="articles" element={<HomePage />} />
        <Route path="write" element={<WritePage />} />
        <Route path="article/:id" element={<ArticleDetailPage />} />
        <Route path="file-upload" element={<FileUploadPage />} />
        <Route path="file-management" element={<FileManagementPage />} />
        <Route path="presentation" element={<PresentationPage />} />
        <Route path="presentation/:id/edit" element={<PresentationEditorPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="expense" element={<ExpensePage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="photos" element={<PhotosPage />} />
        <Route path="zoom" element={<ZoomPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
    </Routes>
  )
}

export default App
