const numberToWords = (num: number): string => {
    const belowTwenty = [
      'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 
      'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 
      'seventeen', 'eighteen', 'nineteen'
    ];
    const tens = [
      '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
    ];
    const scales = ['', 'thousand', 'million', 'billion', 'trillion', 'quadrillion', 'quintillion'];
  
    if (num === 0) return 'zero';
  
    const convertThreeDigits = (n: number): string => {
      if (n === 0) return '';
      if (n < 20) return belowTwenty[n] + ' ';
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + belowTwenty[n % 10] : '') + ' ';
      return belowTwenty[Math.floor(n / 100)] + ' hundred ' + convertThreeDigits(n % 100);
    };
  
    let words = '';
    let scaleIndex = 0;
  
    while (num > 0) {
      const threeDigits = num % 1000;
      if (threeDigits !== 0) {
        words = convertThreeDigits(threeDigits) + scales[scaleIndex] + ' ' + words;
      }
      num = Math.floor(num / 1000);
      scaleIndex++;
    }
  
    return words.trim();
  };

  export default numberToWords;