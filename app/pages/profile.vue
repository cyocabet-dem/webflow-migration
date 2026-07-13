<script setup lang="ts">
useHead({
  title: 'Profile',
  meta: [
    { name: 'description', content: 'Your privacy is our priority, and we are committed to being transparent about our practices regarding how we collect, use, and protect your personal data.' },
    { property: 'og:title', content: 'Profile' },
    { property: 'og:description', content: 'Your privacy is our priority, and we are committed to being transparent about our practices regarding how we collect, use, and protect your personal data.' },
    { name: 'twitter:title', content: 'Profile' },
    { name: 'twitter:description', content: 'Your privacy is our priority, and we are committed to being transparent about our practices regarding how we collect, use, and protect your personal data.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'robots', content: 'noindex' },
  ],
})

const config = useRuntimeConfig()
const route = useRoute()

const sidenavPath = computed(() =>
  route.path.replace(/\/$/, '').replace(/^\/nl(?=\/|$)/, ''),
)
function isSidenavActive(href: string) {
  const h = href.replace(/\/$/, '')
  return sidenavPath.value === h || sidenavPath.value.startsWith(h + '/')
}

const { userData } = useAuth()
const SHIPPING_MEMBERSHIP_NAMES = ['5 items, 1 shipment per month', '5 items per shipment, 2 shipments per month']
const isShippingMember = computed(() => SHIPPING_MEMBERSHIP_NAMES.includes(userData.value?.membership?.name ?? ''))

const { partnerUiEnabled } = usePartnerPlatform()

const loading = ref(true)
const submitting = reactive({
  personal: false,
  address: false,
  size: false,
})
const successMessages = reactive({
  personal: '',
  address: '',
  size: '',
})
const errorMessages = reactive({
  personal: '',
  address: '',
  size: '',
})

const addressSearch = ref('')
const addressResults = ref<any[]>([])
const showAddressResults = ref(false)
let addressDebounce: ReturnType<typeof setTimeout> | undefined

const formData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  dateOfBirth: '',
  phoneNumber: '',
  addressStreet: '',
  addressHouseNumber: '',
  addressUnit: '',
  addressZipcode: '',
  addressCity: '',
  heightCm: '' as string | number,
  preferredFit: '',
  shirtSize: '',
  pantsSize: '',
  shoeSize: '',
})

async function getAuthToken(): Promise<string | null> {
  const auth0Client = (window as any).auth0Client
  if (!auth0Client) return null
  try {
    return await auth0Client.getTokenSilently()
  } catch {
    return null
  }
}

function handleClickOutside(event: MouseEvent) {
  if (!showAddressResults.value) return

  const formGroup = (event.target as HTMLElement | null)?.closest('.form-group')
  if (!formGroup || !formGroup.querySelector('input[placeholder*="Start typing"]')) {
    showAddressResults.value = false
  }
}

function searchAddress() {
  const query = addressSearch.value.trim()

  if (query.length < 3) {
    addressResults.value = []
    showAddressResults.value = false
    return
  }

  clearTimeout(addressDebounce)

  addressDebounce = setTimeout(async () => {
    try {
      const apiKey = config.public.geoapifyKey
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${apiKey}&filter=countrycode:nl&limit=5`

      const response = await fetch(url)
      const data = await response.json()

      if (data.features && data.features.length > 0) {
        addressResults.value = data.features
        showAddressResults.value = true
      } else {
        addressResults.value = []
        showAddressResults.value = false
      }
    } catch (error) {
      console.error('[Profile] Address search error:', error)
    }
  }, 300)
}

function parseApiError(errorData: any): string {
  if (errorData.detail && Array.isArray(errorData.detail)) {
    const messages = errorData.detail.map((err: any) => {
      const field = err.loc ? err.loc[err.loc.length - 1] : 'field'
      const fieldName = String(field).replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
      return `${fieldName}: ${err.msg}`
    })
    return messages.join(', ')
  }

  if (typeof errorData.detail === 'string') {
    return errorData.detail
  }

  return 'Failed to update. Please try again.'
}

function selectAddress(feature: any) {
  const props = feature.properties

  addressSearch.value = props.formatted
  formData.addressStreet = props.street || ''
  formData.addressHouseNumber = props.housenumber || ''
  formData.addressCity = props.city || ''
  formData.addressZipcode = props.postcode || ''

  showAddressResults.value = false
}

async function loadUserData() {
  try {
    const token = await getAuthToken()
    if (!token) {
      loading.value = false
      return
    }

    const response = await fetch(`${config.public.apiBase}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to load profile data')
    }

    const userData = await response.json()

    formData.email = userData.email || ''
    formData.dateOfBirth = userData.date_of_birth ? userData.date_of_birth.split('T')[0] : ''
    formData.phoneNumber = userData.phone_number || ''
    formData.addressHouseNumber = userData.address_house_number || ''
    formData.addressZipcode = userData.address_zipcode || ''
    formData.addressCity = userData.address_city || ''

    if (userData.attributes) {
      const attrMap: Record<string, string> = {
        'first_name': 'firstName',
        'last_name': 'lastName',
        'address_street': 'addressStreet',
        'address_unit': 'addressUnit',
        'height_cm': 'heightCm',
        'preferred_fit': 'preferredFit',
        'shirt_size': 'shirtSize',
        'pants_size': 'pantsSize',
        'shoe_size': 'shoeSize',
      }

      userData.attributes.forEach((attr: { key: string, value: any }) => {
        if (attrMap[attr.key]) {
          ;(formData as any)[attrMap[attr.key]] = attr.value
        }
      })
    }

    loading.value = false
  } catch (error) {
    console.error('[Profile] Error loading data:', error)
    errorMessages.personal = 'Failed to load profile data. Please refresh the page.'
    loading.value = false
  }
}

function clearMessages(section: 'personal' | 'address' | 'size') {
  successMessages[section] = ''
  errorMessages[section] = ''
}

async function updatePersonalInfo() {
  submitting.personal = true
  clearMessages('personal')

  try {
    const token = await getAuthToken()
    if (!token) return

    const customAttributes: { key: string, value: any }[] = []
    if (formData.firstName) {
      customAttributes.push({ key: 'first_name', value: formData.firstName })
    }
    if (formData.lastName) {
      customAttributes.push({ key: 'last_name', value: formData.lastName })
    }

    const apiData = {
      phone_number: formData.phoneNumber || null,
      date_of_birth: formData.dateOfBirth || null,
      attributes: customAttributes,
    }

    const response = await fetch(`${config.public.apiBase}/users/me`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(parseApiError(errorData))
    }

    successMessages.personal = '✓ Personal information updated!'
    setTimeout(() => successMessages.personal = '', 3000)
  } catch (error: any) {
    console.error('[Profile] Error:', error)
    errorMessages.personal = error.message
  } finally {
    submitting.personal = false
  }
}

async function updateAddress() {
  submitting.address = true
  clearMessages('address')

  try {
    const token = await getAuthToken()
    if (!token) return

    const customAttributes: { key: string, value: any }[] = []
    if (formData.addressStreet) {
      customAttributes.push({ key: 'address_street', value: formData.addressStreet })
    }
    if (formData.addressUnit) {
      customAttributes.push({ key: 'address_unit', value: formData.addressUnit })
    }

    const apiData = {
      address_house_number: formData.addressHouseNumber || null,
      address_zipcode: formData.addressZipcode || null,
      address_city: formData.addressCity || null,
      attributes: customAttributes,
    }

    const response = await fetch(`${config.public.apiBase}/users/me`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(parseApiError(errorData))
    }

    successMessages.address = '✓ Address updated!'
    setTimeout(() => successMessages.address = '', 3000)
  } catch (error: any) {
    console.error('[Profile] Error:', error)
    errorMessages.address = error.message
  } finally {
    submitting.address = false
  }
}

async function updateSizeProfile() {
  submitting.size = true
  clearMessages('size')

  try {
    const token = await getAuthToken()
    if (!token) return

    const customAttributes: { key: string, value: any }[] = []
    if (formData.heightCm) {
      customAttributes.push({ key: 'height_cm', value: String(formData.heightCm) })
    }
    if (formData.preferredFit) {
      customAttributes.push({ key: 'preferred_fit', value: formData.preferredFit })
    }
    if (formData.shirtSize) {
      customAttributes.push({ key: 'shirt_size', value: formData.shirtSize })
    }
    if (formData.pantsSize) {
      customAttributes.push({ key: 'pants_size', value: formData.pantsSize })
    }
    if (formData.shoeSize) {
      customAttributes.push({ key: 'shoe_size', value: formData.shoeSize })
    }

    const apiData = {
      attributes: customAttributes,
    }

    const response = await fetch(`${config.public.apiBase}/users/me`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(parseApiError(errorData))
    }

    successMessages.size = '✓ Size profile updated!'
    setTimeout(() => successMessages.size = '', 3000)
  } catch (error: any) {
    console.error('[Profile] Error:', error)
    errorMessages.size = error.message
  } finally {
    submitting.size = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadUserData()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  clearTimeout(addressDebounce)
})
</script>

<template>
  <div>
    <div class="w-layout-blockcontainer container-1300 w-container">
      <div class="div-header-policies rentals">
        <div class="div-heading-content-policies account">
          <div class="heading-text-policies rentals">profile</div>
        </div>
      </div>
      <div class="div-section-policies rentals">
        <div class="sidenav-account-pages w-embed w-script">
          <nav class="account-sidenav" aria-label="Account navigation">
            <div class="account-sidenav-inner">
              <a href="/profile" class="account-sidenav-link" :class="{ active: isSidenavActive('/profile') }" data-nav="profile">
                <span class="account-sidenav-icon">
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="4"></circle>
                    <path d="M20 21a8 8 0 1 0-16 0"></path>
                  </svg>
                </span>
                <span class="lang-en">profile</span><span class="lang-nl">profiel</span>
              </a>
              <a href="/my-rentals" class="account-sidenav-link" :class="{ active: isSidenavActive('/my-rentals') }" data-nav="my-rentals">
                <span class="account-sidenav-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="m21 16-9-6.5V6a2 2 0 1 0-4 0"></path>
                    <path d="M3 16h18v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  </svg>
                </span>
                <span class="lang-en">my rentals</span><span class="lang-nl">mijn huurartikelen</span>
              </a>
              <a v-show="!isShippingMember" href="/reservations" class="account-sidenav-link" :class="{ active: isSidenavActive('/reservations') }" data-nav="reservations" data-auth-gate="collapse">
                <span class="account-sidenav-icon">
                  <svg viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                    <path d="M16 2v4M8 2v4M3 10h18"></path>
                  </svg>
                </span>
                <span class="lang-en">reservations</span><span class="lang-nl">reserveringen</span>
              </a>
              <div class="account-sidenav-sep"></div>
              <a href="/donations-credits" class="account-sidenav-link" :class="{ active: isSidenavActive('/donations-credits') }" data-nav="donations">
                <span class="account-sidenav-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                  </svg>
                </span>
                <span class="lang-en">donations &amp; credits</span><span class="lang-nl">donaties &amp; tegoed</span>
              </a>
              <a href="/purchases" class="account-sidenav-link" :class="{ active: isSidenavActive('/purchases') }" data-nav="purchases">
                <span class="account-sidenav-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <path d="M3 6h18"></path>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                </span>
                <span class="lang-en">purchases</span><span class="lang-nl">aankopen</span>
              </a>
              <a v-show="partnerUiEnabled" href="/partner-activity" class="account-sidenav-link" :class="{ active: isSidenavActive('/partner-activity') }" data-nav="partner-activity"><span class="account-sidenav-icon"><svg viewBox="0 0 24 24"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path><circle cx="7.5" cy="7.5" r="1"></circle></svg></span><span class="lang-en">partner items</span><span class="lang-nl">partneritems</span></a>
              <div class="account-sidenav-sep"></div>
              <a href="/my-membership" class="account-sidenav-link" :class="{ active: isSidenavActive('/my-membership') }" data-nav="membership">
                <span class="account-sidenav-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26z"></path>
                  </svg>
                </span>
                <span class="lang-en">membership</span><span class="lang-nl">lidmaatschap</span>
              </a>
            </div>
          </nav>
        </div>
        <div class="div-policy-menu rentals right">
          <div class="code-embed-account w-embed">
            <div id="vue-profile-app" style="width: 100%; display: contents;">
              <div v-if="loading" class="profile-loading">
                <div class="profile-loading-spinner"></div>
                <p class="profile-loading-text">loading your profile...</p>
              </div>
              <div class="div-policy-menu rentals right">
                <div class="div-content-wrapper-policies right rentals">
                  <div v-if="!loading">
                    <div class="profile-section-header">
                      <div class="profile-section-title">your profile</div>
                    </div>
                    <div class="profile-card">
                      <h2 class="profile-card-title">personal information</h2>
                      <div class="profile-form-row">
                        <div class="profile-form-group profile-form-col-2">
                          <label class="profile-form-label">first name</label>
                          <input type="text" v-model="formData.firstName" class="profile-form-input">
                        </div>
                        <div class="profile-form-group profile-form-col-2">
                          <label class="profile-form-label">last name</label>
                          <input type="text" v-model="formData.lastName" class="profile-form-input">
                        </div>
                      </div>
                      <div class="profile-form-group">
                        <label class="profile-form-label">email</label>
                        <input type="email" v-model="formData.email" class="profile-form-input" readonly>
                        <small class="profile-form-hint">email cannot be changed</small>
                      </div>
                      <div class="profile-form-group">
                        <label class="profile-form-label">date of birth</label>
                        <input type="date" v-model="formData.dateOfBirth" class="profile-form-input" autocomplete="bday" data-lpignore="true" data-1p-ignore="true">
                      </div>
                      <div class="profile-form-group">
                        <label class="profile-form-label">phone number</label>
                        <input type="tel" v-model="formData.phoneNumber" class="profile-form-input" autocomplete="tel">
                      </div>
                      <div v-if="successMessages.personal" class="profile-msg-success">
                        {{ successMessages.personal }}
                      </div>
                      <div v-if="errorMessages.personal" class="profile-msg-error">
                        {{ errorMessages.personal }}
                      </div>
                      <button @click="updatePersonalInfo" :disabled="submitting.personal" class="profile-btn-primary">
                        {{ submitting.personal ? 'saving...' : 'update personal info' }}
                      </button>
                    </div>
                    <div class="profile-card">
                      <h2 class="profile-card-title">address</h2>
                      <div class="profile-form-group" style="position: relative;">
                        <label class="profile-form-label">find your address</label>
                        <input type="text" v-model="addressSearch" @input="searchAddress" placeholder="start typing your address..." class="profile-form-input" autocomplete="new-password">
                        <div v-if="showAddressResults" class="profile-address-results">
                          <div v-for="(result, index) in addressResults" :key="index" @click="selectAddress(result)" class="profile-address-result-item">
                            {{ result.properties.formatted }}
                          </div>
                        </div>
                      </div>
                      <div class="profile-form-group">
                        <label class="profile-form-label">street</label>
                        <input type="text" v-model="formData.addressStreet" class="profile-form-input">
                      </div>
                      <div class="profile-form-row">
                        <div class="profile-form-group profile-form-col-2">
                          <label class="profile-form-label">house number</label>
                          <input type="text" v-model="formData.addressHouseNumber" class="profile-form-input">
                        </div>
                        <div class="profile-form-group profile-form-col-2">
                          <label class="profile-form-label">apt / suite / unit</label>
                          <input type="text" v-model="formData.addressUnit" placeholder="optional" class="profile-form-input">
                        </div>
                      </div>
                      <div class="profile-form-row">
                        <div class="profile-form-group profile-form-col-2">
                          <label class="profile-form-label">postal code</label>
                          <input type="text" v-model="formData.addressZipcode" class="profile-form-input">
                        </div>
                        <div class="profile-form-group profile-form-col-2">
                          <label class="profile-form-label">city</label>
                          <input type="text" v-model="formData.addressCity" class="profile-form-input">
                        </div>
                      </div>
                      <div v-if="successMessages.address" class="profile-msg-success">
                        {{ successMessages.address }}
                      </div>
                      <div v-if="errorMessages.address" class="profile-msg-error">
                        {{ errorMessages.address }}
                      </div>
                      <button @click="updateAddress" :disabled="submitting.address" class="profile-btn-primary">
                        {{ submitting.address ? 'saving...' : 'update address' }}
                      </button>
                    </div>
                    <div class="profile-card">
                      <h2 class="profile-card-title">size profile</h2>
                      <div class="profile-form-row">
                        <div class="profile-form-group profile-form-col-2">
                          <label class="profile-form-label">height (cm)</label>
                          <input type="number" v-model="formData.heightCm" placeholder="175" class="profile-form-input">
                        </div>
                        <div class="profile-form-group profile-form-col-2">
                          <label class="profile-form-label">preferred fit</label>
                          <select v-model="formData.preferredFit" class="profile-form-input">
                            <option value="">select fit...</option>
                            <option value="Slim">slim</option>
                            <option value="Regular">regular</option>
                            <option value="Oversized">oversized</option>
                          </select>
                        </div>
                      </div>
                      <div class="profile-form-row">
                        <div class="profile-form-group profile-form-col-2">
                          <label class="profile-form-label">typical shirt size</label>
                          <input type="text" v-model="formData.shirtSize" placeholder="M, L, XL" class="profile-form-input">
                        </div>
                        <div class="profile-form-group profile-form-col-2">
                          <label class="profile-form-label">typical pants size</label>
                          <input type="text" v-model="formData.pantsSize" placeholder="32, 34, 36" class="profile-form-input">
                        </div>
                      </div>
                      <div class="profile-form-group">
                        <label class="profile-form-label">shoe size</label>
                        <input type="text" v-model="formData.shoeSize" placeholder="42, 43, 44" class="profile-form-input">
                      </div>
                      <div v-if="successMessages.size" class="profile-msg-success">
                        {{ successMessages.size }}
                      </div>
                      <div v-if="errorMessages.size" class="profile-msg-error">
                        {{ errorMessages.size }}
                      </div>
                      <button @click="updateSizeProfile" :disabled="submitting.size" class="profile-btn-primary">
                        {{ submitting.size ? 'saving...' : 'update size profile' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mobile-footer-spacer"></div>
  </div>
</template>

<style>
/* Base styles for Vue form */
[v-cloak] {
  display: none !important;
}
.form-label {
    font-family: 'Urbanist', sans-serif;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: 0.3px;
    color: #000;
    text-transform: capitalize;
    padding-bottom: 5px;
    margin-bottom: 0;
    display: block;
}
.form-input-field {
    display: block;
    width: 100%;
    height: 44px;
    padding: 8px 12px;
    font-size: 14px;
    line-height: 1.43;
    color: #333;
    background-color: #ffffff;
    border: 1px solid #cccccc;
    border-radius: 0px;
    font-family: 'Urbanist', sans-serif;
    transition: border-color .2s, box-shadow .2s;
}
.form-input-field:focus {
    border-color: #000;
    outline: 0;
    box-shadow: 0 0 .5px .5px #000;
}
/* Override autofill background color */
.form-input-field:-webkit-autofill,
.form-input-field:-webkit-autofill:hover,
.form-input-field:-webkit-autofill:focus,
.form-input-field:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px #fbefff inset !important;
    box-shadow: 0 0 0 30px #fbefff inset !important;
    -webkit-text-fill-color: #333 !important;
}
/* For Firefox */
.form-input-field:-moz-autofill,
.form-input-field:-moz-autofill-preview {
    background-color: #fbefff !important;
}
/* Textarea */
textarea.form-input-field {
    height: auto;
    min-height: 100px;
}
/* Select dropdown */
select.form-input-field {
    height: 44px;
}
/* Checkbox */
.form-checkbox-input {
    width: 16px;
    height: 16px;
    margin: 0;
    flex-shrink: 0;
    accent-color: #000;
}
.checkbox-group {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-top: 8px;
}
.form-checkbox-label {
    font-size: 12px;
    font-weight: 300;
    line-height: 1.4;
    font-family: 'Urbanist', sans-serif;
}
.form-checkbox-label a {
    color: #000;
    text-decoration: underline;
}
/* Form rows */
.form-row {
    display: flex;
    gap: 16px;
}
.form-col-2 {
    flex: 1;
}
.form-col-3 {
    flex: 2;
}
.form-col-3-small {
    flex: 1;
    max-width: 120px;
}
.form-group {
    position: relative;
    margin-bottom: 16px;
}
/* Profile Page Specific Styles */
.step-title {
  font-family: 'Urbanist', sans-serif;
  font-weight: 400;
  font-size: 18px;
  line-height: 28px;
  letter-spacing: 0.5px;
  color: #000;
  text-transform: capitalize;
  padding-bottom: 1.6rem;
  margin-top: 32px;
  margin-bottom: 0;
}
.form-button-primary {
  width: 100%;
  max-width: 300px;
  padding: 8px 16px;
  font-family: 'Urbanist', sans-serif;
  font-size: 14px;
  font-weight: 300;
  letter-spacing: 0.5px;
  color: #f0f0f0;
  text-transform: capitalize;
  border-radius: 0px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background-color: #000;
}
.form-button-primary:hover:not(:disabled) {
  background-color: #333;
  transform: translateY(-1px);
}
.form-button-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
/* Mobile responsive */
@media screen and (max-width: 767px) {
    .form-row {
        flex-direction: column;
    }
    .form-col-3-small {
        max-width: 100%;
    }
}
</style>
