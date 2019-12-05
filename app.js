const app = require('express')();
const puppeteer = require('puppeteer')
const fakeInfoGenerator = 'https://www.fakeaddressgenerator.com/World_Address/get_us_address/city/Houston'
const HoustonLibrary = 'https://halan.sdp.sirsi.net/client/en_US/hou/search/registration/$N?pc=SYMWS_HOUSTON';

(async function (req,res){
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  })

  const page = await browser.newPage()
  console.log('Opening the headless browser..\n')

  await page.goto(fakeInfoGenerator, { waitUntil: 'networkidle0', timeout: false }) // wait until page load
  console.log('Started the process..\n')
  console.log('Gathering fake information..\n')
  // get name, color from the page dom
  // split both values into an array of words
  const info = await page.evaluate(() => {
    let basicInfoTitles = Array.from(document.querySelectorAll('table tr td span')).map(x => x.innerHTML)
    let basicInfoValues = Array.from(document.querySelectorAll('table tr td strong')).map(x => x.innerHTML)

    let titles = Array.from(document.querySelectorAll('div>.col-md-4>span')).map(x => x.innerText)
    let values = Array.from(document.querySelectorAll('div>.col-md-8>strong>input')).map(x => x.value)
    let address = {}
    let basicInfo = {}

    for(let i=0; i<=basicInfoTitles.length; i++) {
      basicInfo[basicInfoTitles[i]] = basicInfoValues[i]
    }
    for(let i=0; i<=titles.length; i++) {
      address[titles[i]] = values[i]
    }

    return {...address, ...basicInfo}
  })
  console.log('Going to Houstonlibrary website..\n')
  await page.goto(HoustonLibrary, { waitUntil: 'networkidle0', timeout: false }) // wait until page load

  await page.evaluate( info => {
    const splitName = info['Full Name'].split('&nbsp;')
    const firstName = splitName[0]
    const lastName = splitName[2]
    const randomPIN = Math.round(Math.random()* 32201);

    console.log('Filling up the Houston Library registration form..\n')
    
    document.querySelector('input.FIRST_NAME').value = firstName
    document.querySelector('input.LAST_NAME').value = lastName
    document.querySelector('input.LAST_NAME').value = lastName
    document.querySelector('input.BIRTH_DATE').value = info['Birthday']
    document.querySelector('input.ADDRESS').value = info['Street']
    document.querySelector('input.CITY').value = info['City']
    document.querySelector('input.STATE').value = info['State']
    document.querySelector('input.ZIP').value = info['Zip Code']
    document.querySelector('input.PHONE_NUMBER').value = info['Phone Number']
    document.querySelector('input.EMAIL_ADDRESS#confirmField1').value = `hoda${randomPIN}@gmail.com`
    document.querySelector('input.EMAIL_ADDRESS#confirmField2').value = `hoda${randomPIN}@gmail.com`
    document.querySelector('#pwdField1').value = randomPIN
    document.querySelector('#pwdField2').value = randomPIN
    document.querySelector('#registrationSubmit').click();
    
    // return randomPIN
  }, info)

  await page.waitForSelector('.postRegistration p')

  console.log('Successfully registered a Houston Library Card Number! \n')
  const libraryCode = await page.evaluate(()=> document.querySelector('.postRegistration p').innerText.split(' ')[5].trim().replace('.',''))
  console.log("Here is your Library Card Number :", libraryCode+'\n')
  console.log("Go to https://www.lynda.com/portal/sip?org=houstonlibrary.org and click on 'Create Profile' then follow the steps.\n")
  console.log("Donate to https://paypal.me/SharlSherif if you find this script useful\n")
  console.log("Exiting ...\n")
  process.exit(0);
 })()

app.listen(5000, ()=> console.log('Script is running on port 5000\n'))