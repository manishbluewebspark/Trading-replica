
import SignInUser from "../../components/auth/SignInUser";
import PageMeta from "../../components/common/PageMeta";



export default function SignIn() {
  return (
    <>
      <PageMeta
        title="SignIn Dashboard"
        description="This is React.js SignIn Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
     
       <SignInUser /> 
       
     
    </>
  );
}
