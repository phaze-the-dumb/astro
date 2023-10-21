// Format seconds into minutes and seconds

let formatTime = ( seconds: number ): string => {
  if(seconds > 59){
    return (seconds / 60).toFixed(2) + ' Minutes';
  } else{
    return seconds.toString() + ' Seconds';
  }
}

export { formatTime }