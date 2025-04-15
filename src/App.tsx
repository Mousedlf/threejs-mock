import { SignedIn, SignedOut } from "@clerk/clerk-react";
import SignInPage from "./components/SignInPage";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import React from "react";

export default function App() {
    return (
        <>
            <SignedOut>
                <SignInPage />
            </SignedOut>
            <SignedIn>
                <Header/>
                <Dashboard />
            </SignedIn>
        </>
    );
}
