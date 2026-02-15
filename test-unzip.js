import unzipper from 'unzipper';
import fs from 'fs';

console.log('unzipper:', unzipper);
try {
  console.log('unzipper.Open:', unzipper.Open);
} catch (e) {
  console.log('Error accessing Open:', e);
}
