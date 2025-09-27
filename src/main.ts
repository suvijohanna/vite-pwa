import {pwaInfo} from 'virtual:pwa-info';
import {fetchData} from './functions';
import {UpdateResult} from './interfaces/UpdateResult';
import {UploadResult} from './interfaces/UploadResult';
import { UpdateUser } from './interfaces/UpdateUser';
import {LoginUser, User} from './interfaces/User';
import {apiUrl, uploadUrl} from './variables';
import {registerSW} from 'virtual:pwa-register';

// PWA code
console.log(pwaInfo);

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('on need refresh tapahtui');
    const update = confirm('Haluatko uuden version?');
    if (update) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('sovellus on offline valmis');
    alert('sovellus on offline valmis');
  },
});

// select forms from the DOM
const loginForm = document.querySelector(
  '#login-form'
) as HTMLFormElement | null;
const profileForm = document.querySelector(
  '#profile-form'
) as HTMLFormElement | null;
const avatarForm = document.querySelector(
  '#avatar-form'
) as HTMLFormElement | null;

// select inputs from the DOM
const usernameInput = document.querySelector(
  '#username'
) as HTMLInputElement | null;
const passwordInput = document.querySelector(
  '#password'
) as HTMLInputElement | null;

const profileUsernameInput = document.querySelector(
  '#profile-username'
) as HTMLInputElement | null;
const profileEmailInput = document.querySelector(
  '#profile-email'
) as HTMLInputElement | null;
const avatarInput = document.querySelector(
  '#avatar'
) as HTMLInputElement | null;

// select profile elements from the DOM
const usernameTarget = document.querySelector(
  '#username-target'
) as HTMLSpanElement | null;
const emailTarget = document.querySelector(
  '#email-target'
) as HTMLSpanElement | null;
const avatarTarget = document.querySelector(
  '#avatar-target'
) as HTMLImageElement | null;

// function to login
const login = async (): Promise<LoginUser> => {
  if (!usernameInput || !passwordInput) {
    throw new Error('käyttäjä tai salasana kenttää ei ole');
  }
  const username = usernameInput.value;
  const password = passwordInput.value;

  const data = {
    username,
    password,
  };

  const options: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };

  const loginResult = await fetchData<LoginUser>(
    apiUrl + '/auth/login',
    options
  );
  return loginResult;
};

// function to update user data
const updateUserData = async (
  user: UpdateUser,
  token: string
): Promise<UpdateResult> => {
  const options: RequestInit = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    },
    body: JSON.stringify(user),
  };

  return await fetchData<UpdateResult>(apiUrl + '/users', options);
};

// TODO: function to upload image
const uploadAvatar = async (): Promise<UploadResult> => {
  if (!avatarForm) {
    throw new Error('avatar formii ei ooo si');
  }
  const fd = new FormData(avatarForm);

  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('pittää olla kirjautunut si');
  }

  const options: RequestInit = {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
    },
    body: fd,
  };

  return await fetchData<UploadResult>(apiUrl + '/users/avatar', options);
};

// function to add userdata (email, username and avatar image) to the
// Profile DOM and Edit Profile Form
const addUserDataToDom = (user: User): void => {
  if (!usernameTarget || !emailTarget || !avatarTarget) {
    throw new Error('kohde-elementit puuttuu');
  }
  usernameTarget.innerText = user.username;
  emailTarget.innerText = user.email;
  avatarTarget.src = uploadUrl + user.avatar;
};

// function to get userdata from API using token
const getUserData = async (token: string): Promise<User> => {
  const options: RequestInit = {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  };
  return await fetchData<User>(apiUrl + '/users/token', options);
};

// function to check local storage for token and if it exists fetch
// userdata with getUserData then update the DOM with addUserDataToDom
const checkToken = async (): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    const userData = await getUserData(token);
    if (!userData) {
      return;
    }

    addUserDataToDom(userData);
  } catch (error) {}
};

// call checkToken on page load to check if token exists and update the DOM
checkToken();

// login form event listener
// event listener should call login function and save token to local storage
// then call addUserDataToDom to update the DOM with the user data
if (!loginForm) {
  console.error('login-lomake puuttuu');
} else {
  loginForm.addEventListener('submit', async (evt) => {
    try {
      evt.preventDefault();
      const loginResult = await login();
      console.log(loginResult);
      localStorage.setItem('token', loginResult.token);
      addUserDataToDom(loginResult.data);
    } catch (error) {
        alert((error as Error).message);
    }
  });
}

// profile form event listener
// event listener should call updateUserData function and update the DOM with
// the user data by calling addUserDataToDom or checkToken
profileForm?.addEventListener('submit', async (evt) => {
  evt.preventDefault();

  try {
    if (!profileUsernameInput || !profileEmailInput) {
      throw new Error('Syötekentät puuttuu');
    }

    const username = profileUsernameInput.value;
    const email = profileEmailInput.value;
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Käyttäjä ei ole kirjautunut sisään');
    }

    const updateResult = await updateUserData({ username, email }, token);
    console.log(updateResult);

    await checkToken();
  } catch (error) {
      alert((error as Error).message);
  }
});

// avatar form event listener
// event listener should call uploadAvatar function and update the DOM with
// the user data by calling addUserDataToDom or checkToken
avatarForm?.addEventListener('submit', async (evt) => {
  try {
    evt.preventDefault();
    await uploadAvatar();
    await checkToken();
  } catch (error) {
      alert((error as Error).message);
  }
});
