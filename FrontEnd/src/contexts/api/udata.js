export default function GetUserData() {
  const u_info = {
    u_token: localStorage.token,
    u_id: localStorage.id,
    u_idPS: localStorage.idPS,
    u_nom: localStorage.nom,
    u_prenom: localStorage.prenom,
    u_karazana: localStorage.karazana,
  };

  const headOpts = {
    opts: {
      headers: {
        Authorization: u_info.u_token,
      },
    },
  };

  let u_data = Object.assign({}, u_info);
  u_data = Object.assign(u_data, headOpts);

  return u_data;
}
