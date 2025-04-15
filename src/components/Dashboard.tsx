import UserDetails from "./UserDetails";
import ModelMug from "./ModelMug";
import React from "react";

export default function Dashboard() {
    return (
        <>
        <div className="dashboard">
            <UserDetails />
            <ModelMug />
        </div>
        </>
    );
}