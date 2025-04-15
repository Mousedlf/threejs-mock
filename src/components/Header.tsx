import {UserButton, useSession, useUser} from "@clerk/clerk-react";
import React from "react";

export default function Header(){

    const {user} = useUser();
    const {session} = useSession();

    if (!user || !session) return null;

    return (
        <>
            <header>
                <p>TRee</p>
                <div className="header-user">
                    <p>{user.firstName}</p>
                    <UserButton
                        appearance={{
                            elements: {
                                userButtonAvatarBox: "size-6"
                            }
                        }}
                    />
                </div>
            </header>
        </>
    );
}