import AuthLayout from "./AuthPageLayout";
import NewPasswordForm from "../../components/auth/NewPassword";


export default function NewPassword() {
    return(
        <>
        <AuthLayout>
            <NewPasswordForm />
        </AuthLayout>
        </>
    )
}