
const Login = ({ onClick }: 
  { 
    onClick: () => void 
  }) => {

  return (
    <div>
      <button onClick={onClick}>Login as SamFisher753</button>
    </div>
  );
};

export default Login;