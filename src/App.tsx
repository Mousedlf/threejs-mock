import { SignedIn, SignedOut } from "@clerk/clerk-react";
import SignInPage from "./components/SignInPage.tsx";
import Header from "./components/Header.tsx";
import Dashboard from "./components/Dashboard.tsx";

export default function App() {
    return (
        <header>
            <SignedOut>
                <SignInPage />
            </SignedOut>
            <SignedIn>
                <Header/>
                <Dashboard />
            </SignedIn>
        </header>
    );
}
