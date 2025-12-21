import AuthLayout from "./AuthPageLayout";
import VerifyCodeForm from "../../components/auth/VerifyCodeForm";
export default function VerifyCode() {
    return(
        <>
        <AuthLayout>
            <VerifyCodeForm />
        </AuthLayout>
        </>
    )
}