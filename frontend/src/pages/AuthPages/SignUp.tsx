import PageMeta from "../../components/common/PageMeta";

import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Software Setu"
        description="This is React.js SignUp Tables Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
     
        <SignUpForm />
     
    </>
  );
}
