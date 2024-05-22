
import React, { useEffect, useState } from 'react';
import { Box, Button, Container, Grid, Link, SvgIcon, Typography} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJs , LinearScale, PointElement, Tooltip, Legend, TimeScale, LineController, LineElement, CategoryScale} from 'chart.js';
import 'chartjs-adapter-date-fns';
import axios from 'axios';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Search from './components/Search/Search';
import WeeklyForecast from './components/WeeklyForecast/WeeklyForecast';
import TodayWeather from './components/TodayWeather/TodayWeather';
import { fetchTime, fetchWeatherData } from './api/OpenWeatherService';
import { transformDateFormat } from './utilities/DatetimeUtils';
import UTCDatetime from './components/Reusable/UTCDatetime';
import LoadingBox from './components/Reusable/LoadingBox';
import { ReactComponent as SplashIcon } from './assets/splash-icon.svg';
import Logo from './assets/logo.png';
import ErrorBox from './components/Reusable/ErrorBox';
import { ALL_DESCRIPTIONS } from './utilities/DateConstants';
import { getTodayForecastWeather, getWeekForecastWeather } from './utilities/DataUtils';
import SunriseSunsetWidget from './components/Reusable/SunriseSunsetWidget';

function App() {
  const [todayWeather, setTodayWeather] = useState(null);
  const [todayForecast, setTodayForecast] = useState([]);
  const [weekForecast, setWeekForecast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [show, setShow] = useState(false);
  const [value, setValue] = useState([null, null]);
  const [lat, setLat] = useState();
  const [lon, setLon] = useState();
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorHistoric, setErrorHistoric] = useState(null);
  const [sunrise, setSunrise] = useState();
  const [sunset, setSunset] = useState();


  ChartJs.register(LinearScale, PointElement, Tooltip, Legend, TimeScale, LineController, LineElement, CategoryScale); 

  const theme = createTheme({
    components: {
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '& .PrivateNotchedOutline-root-14': {
              borderColor: 'white !important', // Change border color
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: 'white !important', // Change label color
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            color: 'white !important', // Change text color
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: 'white !important', // Change icon color
          },
        },
      },
    },
  });

  const options = {
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'hour',
          tooltipFormat: 'yyyy-MM-dd HH:mm',
          displayFormats: {
            hour: 'MMM dd, HH:mm',
          },
        },
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Temperature (°C)',
        },
        min: 0,
        max: 50,
      },
    },
  };

  useEffect(()=>{
    console.log(chartData, "chartDataaa");
  },[chartData])

  const fetchHistoricWeatherData = async () => {
    setLoading(true);
    setErrorHistoric(null);

    try {
      const response = await axios.get('https://archive-api.open-meteo.com/v1/archive', {
        params: {
          latitude: lat,
          longitude: lon,
          start_date: new Date(value[0]).toISOString().slice(0, 10),
          end_date: new Date(value[1]).toISOString().slice(0, 10),
          hourly: 'temperature_2m',
        },
      });


      const temperatures = response.data.hourly.temperature_2m;
      const timestamps = response.data.hourly.time;
      const historicalData = timestamps.map((x, index) => ({ x, y: temperatures[index] }));


      console.log(timestamps, "timestamps");
      console.log(temperatures, "temperatures");
      const data = {
        labels: timestamps,
        datasets: [
          {
            label: 'Temperature (°C)',
            data: historicalData,
            borderColor: 'rgba(75,192,192,1)',
            backgroundColor: 'rgba(75,192,192,0.2)',
            fill: true,
          },
        ],
      };

      setChartData(data);
     
    } catch (err) {
      setErrorHistoric('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const searchChangeHandler = async (enteredData) => {
    const [latitude, longitude] = enteredData.value.split(' ');

    setIsLoading(true);
    setShow(false);
    setChartData(null);
    setValue([null, null]);

    const currentDate = transformDateFormat();
    const date = new Date();
    let dt_now = Math.floor(date.getTime() / 1000);

    try {
      const [todayWeatherResponse, weekForecastResponse] = await fetchWeatherData(latitude, longitude);
      const timings = await fetchTime(latitude,longitude);
      console.log(timings, "timingssss");
      const all_today_forecasts_list = getTodayForecastWeather(weekForecastResponse, currentDate, dt_now);
      const all_week_forecasts_list = getWeekForecastWeather(weekForecastResponse, ALL_DESCRIPTIONS);

      setTodayForecast([...all_today_forecasts_list]);
      setTodayWeather({ city: enteredData.label, ...todayWeatherResponse });
      setWeekForecast({ city: enteredData.label, list: all_week_forecasts_list });
      setSunrise(timings.results.sunrise);
      setSunset(timings.results.sunset);
    } catch (error) {
      setError(true);
    }

    setIsLoading(false);
  };

  const toggleShow = () => {
    setShow((prevShow) => !prevShow);
  };

  let appContent = (
    <Box
      xs={12}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      sx={{ width: '100%', minHeight: '500px' }}
    >
      <SvgIcon component={SplashIcon} inheritViewBox sx={{ fontSize: { xs: '100px', sm: '120px', md: '140px' } }} />
      <Typography
        variant="h4"
        component="h4"
        sx={{
          fontSize: { xs: '12px', sm: '14px' },
          color: 'rgba(255,255,255, .85)',
          fontFamily: 'Poppins',
          textAlign: 'center',
          margin: '2rem 0',
          maxWidth: '80%',
          lineHeight: '22px',
        }}
      >
        Explore current weather data and 6-day forecast of more than 200,000 cities!
      </Typography>
    </Box>
  );

  if (todayWeather && todayForecast && weekForecast) {
    appContent = (
      <>
        <Grid item xs={12} md={todayWeather ? 6 : 12}>
          <Grid item xs={12}>
            <TodayWeather data={todayWeather} forecastList={todayForecast} />
          </Grid>
        </Grid>
        <Grid item xs={12} md={6}>
          <WeeklyForecast data={weekForecast} />
        </Grid>
      </>
    );
  }

  if (error) {
    appContent = <ErrorBox margin="3rem auto" flex="inherit" errorMessage="Something went wrong" />;
  }

  if (isLoading) {
    appContent = (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minHeight: '500px' }}
      >
        <LoadingBox value="1">
          <Typography
            variant="h3"
            component="h3"
            sx={{
              fontSize: { xs: '10px', sm: '12px' },
              color: 'rgba(255, 255, 255, .8)',
              lineHeight: 1,
              fontFamily: 'Poppins',
            }}
          >
            Loading...
          </Typography>
        </LoadingBox>
      </Box>
    );
  }

  return (
    <Container
      sx={{
        maxWidth: { xs: '95%', sm: '80%', md: '1100px' },
        width: '100%',
        height: '100%',
        margin: '0 auto',
        padding: '1rem 0 3rem',
        marginBottom: '1rem',
        borderRadius: { xs: 'none', sm: '0 0 1rem 1rem' },
        boxShadow: {
          xs: 'none',
          sm: 'rgba(0,0,0, 0.5) 0px 10px 15px -3px, rgba(0,0,0, 0.5) 0px 4px 6px -2px',
        },
      }}
    >
      <Grid container columnSpacing={2}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ width: '100%', marginBottom: '1rem' }}>
            <Box component="img" sx={{ height: { xs: '16px', sm: '22px', md: '26px' }, width: 'auto' }} alt="logo" src={Logo} />
            <UTCDatetime />
            <Link href="https://github.com/chirag-cs/Hiring-hood" target="_blank" underline="none" sx={{ display: 'flex' }}>
              <GitHubIcon sx={{ fontSize: { xs: '20px', sm: '22px', md: '26px' }, color: 'white', '&:hover': { color: '#2d95bd' } }} />
            </Link>
          </Box>
          <Search onSearchChange={searchChangeHandler} setLat={setLat} setLon={setLon} />
        </Grid>
        {appContent}
       <Grid item xs={12}>
       {sunrise && sunset ? ( <Box display="flex" justifyContent="center" alignItems="center" sx={{ width: '100%', marginTop:"2rem", marginBottom:"1rem" }}>
        <SunriseSunsetWidget sunrise={sunrise} sunset={sunset}/>
        </Box>) : null}
       </Grid>
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ width: '100%' }}>
          <Button
            onClick={toggleShow}
            sx={{
              display: 'inline-block',
              fontSize: { xs: '10px', sm: '14px' },
              textTransform: 'uppercase',
              padding: { xs: '0.1rem 0.2rem', sm: '0.3rem 0.5rem' },
              marginTop: '1rem',
              border: '1px solid white',
              color: 'white',
              fontFamily: 'Poppins',
              fontWeight: 'medium',
              '&:hover': {
                color: 'primary.main',
              },
            }}
          >
            {show ? 'Hide historical data' : 'Show historical data'}
          </Button>
        </Box>
        {show && (
          <Grid container spacing={2} sx={{ paddingTop: '2rem', width: '100%' }}>
            <Grid item xs={12} display="flex" flexDirection="column">
            <ThemeProvider theme={theme}>
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <DateRangePicker
      calendars={1}
      value={value}
      onChange={(newValue) => setValue(newValue)}
      startText="Start Date"
      endText="End Date"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
      }}
    />
    <Button
      onClick={fetchHistoricWeatherData}
      disabled={!value[0] || !value[1]}
      sx={{
        marginTop: '1rem',
        fontSize: { xs: '12px', sm: '16px' },
        color: 'white',
        fontFamily: 'Poppins',
        fontWeight: 'medium',
        '&:hover': {
          color: 'primary.main',
        },
      }}
    >
      Get Historical Data
    </Button>
  </LocalizationProvider>
</ThemeProvider>
            </Grid>
            <Grid item xs={12}>
              {loading ? (
                <LoadingBox value="1">
                  <Typography
                    variant="h3"
                    component="h3"
                    sx={{
                      fontSize: { xs: '10px', sm: '12px' },
                      color: 'rgba(255, 255, 255, .8)',
                      lineHeight: 1,
                      fontFamily: 'Poppins',
                    }}
                  >
                    Loading...
                  </Typography>
                </LoadingBox>
              ) : errorHistoric ? (
                <ErrorBox errorMessage={errorHistoric} />
              ) : chartData ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  sx={{ width: '100%', minHeight: '500px' }}
                >
                  <Line data={chartData} options={options} />
                </Box>
              ) : null}
            </Grid>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

export default App;
