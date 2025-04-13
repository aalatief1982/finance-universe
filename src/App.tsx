
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { Home } from "./pages/Home";
import { Dev } from "./pages/Dev";
import { Auth } from "./pages/Auth";
import { Budget } from "./pages/Budget";
import Settings from "./pages/Settings";
import { RequireAuth } from "./components/RequireAuth";
import { useAuth } from "./hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Toast } from "@/components/ui/toast";
import TrainModel from '@/pages/TrainModel';

function App() {
  const { authState, loadAuthState } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadAuthState();
  }, [loadAuthState]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route
          path="/dev"
          element={
            <RequireAuth>
              <Dev />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <Settings />
            </RequireAuth>
          }
        />
        <Route
          path="/budget"
          element={
            <RequireAuth>
              <Budget />
            </RequireAuth>
          }
        />
        
        <Route path="/train-model" element={<TrainModel />} />
        
      </Routes>
      
      <Toast />
    </BrowserRouter>
  );
}

export default App;
