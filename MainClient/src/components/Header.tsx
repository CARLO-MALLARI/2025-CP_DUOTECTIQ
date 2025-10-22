// import React from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   StatusBar,
//   Platform,
// } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// interface HeaderProps {
//   title?: string;
//   subtitle?: string;
//   showBack?: boolean;
//   showMenu?: boolean;
//   showSearch?: boolean;
//   showNotifications?: boolean;
//   onBackPress?: () => void;
//   onMenuPress?: () => void;
//   onSearchPress?: () => void;
//   onNotificationPress?: () => void;
//   rightComponent?: React.ReactNode;
//   leftComponent?: React.ReactNode;
//   isDarkMode?: boolean;
//   transparent?: boolean;
//   notificationCount?: number;
// }

// const Header: React.FC<HeaderProps> = ({
//   title = 'App Title',
//   subtitle,
//   showBack = false,
//   showMenu = false,
//   showSearch = false,
//   showNotifications = false,
//   onBackPress,
//   onMenuPress,
//   onSearchPress,
//   onNotificationPress,
//   rightComponent,
//   leftComponent,
//   isDarkMode = false,
//   transparent = false,
//   notificationCount = 0,
// }) => {
//   const navigation = useNavigation();

//   // Colors
//   const backgroundColor = transparent
//     ? 'transparent'
//     : isDarkMode
//     ? '#1F2937'
//     : '#FFFFFF';
//   const textColor = isDarkMode ? '#FFFFFF' : '#1F2937';
//   const subtitleColor = isDarkMode ? '#9CA3AF' : '#6B7280';
//   const iconColor = isDarkMode ? '#FFFFFF' : '#374151';
//   const borderColor = isDarkMode ? '#374151' : '#E5E7EB';

//   const handleBackPress = () => {
//     if (onBackPress) {
//       onBackPress();
//     } else {
//       navigation.goBack();
//     }
//   };

//   return (
//     <>
//       <StatusBar
//         barStyle={isDarkMode ? 'light-content' : 'dark-content'}
//         backgroundColor={backgroundColor}
//       />
//       <View
//         style={[
//           styles.container,
//           {
//             backgroundColor,
//             borderBottomColor: transparent ? 'transparent' : borderColor,
//           },
//         ]}
//       >
//         {/* Left Section */}
//         <View style={styles.leftSection}>
//           {leftComponent ? (
//             leftComponent
//           ) : (
//             <>
//               {showBack && (
//                 <TouchableOpacity
//                   style={styles.iconButton}
//                   onPress={handleBackPress}
//                   activeOpacity={0.7}
//                 >
//                   <MaterialIcons
//                     name="arrow-back"
//                     size={24}
//                     color={iconColor}
//                   />
//                 </TouchableOpacity>
//               )}
//               {showMenu && (
//                 <TouchableOpacity
//                   style={styles.iconButton}
//                   onPress={onMenuPress}
//                   activeOpacity={0.7}
//                 >
//                   <MaterialIcons name="menu" size={24} color={iconColor} />
//                 </TouchableOpacity>
//               )}
//             </>
//           )}
//         </View>

//         {/* Center Section - Title */}
//         <View style={styles.centerSection}>
//           <Text
//             style={[styles.title, { color: textColor }]}
//             numberOfLines={1}
//             ellipsizeMode="tail"
//           >
//             {title}
//           </Text>
//           {subtitle && (
//             <Text
//               style={[styles.subtitle, { color: subtitleColor }]}
//               numberOfLines={1}
//               ellipsizeMode="tail"
//             >
//               {subtitle}
//             </Text>
//           )}
//         </View>

//         {/* Right Section */}
//         <View style={styles.rightSection}>
//           {rightComponent ? (
//             rightComponent
//           ) : (
//             <>
//               {showSearch && (
//                 <TouchableOpacity
//                   style={styles.iconButton}
//                   onPress={onSearchPress}
//                   activeOpacity={0.7}
//                 >
//                   <MaterialIcons name="search" size={24} color={iconColor} />
//                 </TouchableOpacity>
//               )}
//               {showNotifications && (
//                 <TouchableOpacity
//                   style={styles.iconButton}
//                   onPress={onNotificationPress}
//                   activeOpacity={0.7}
//                 >
//                   <MaterialIcons
//                     name="notifications"
//                     size={24}
//                     color={iconColor}
//                   />
//                   {notificationCount > 0 && (
//                     <View style={styles.badge}>
//                       <Text style={styles.badgeText}>
//                         {notificationCount > 99 ? '99+' : notificationCount}
//                       </Text>
//                     </View>
//                   )}
//                 </TouchableOpacity>
//               )}
//             </>
//           )}
//         </View>
//       </View>
//     </>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     height: Platform.OS === 'ios' ? 100 : 60,
//     paddingTop: Platform.OS === 'ios' ? 44 : 0,
//     paddingHorizontal: 16,
//     borderBottomWidth: 1,
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//   },
//   leftSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     minWidth: 50,
//   },
//   centerSection: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 16,
//   },
//   rightSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     minWidth: 50,
//     justifyContent: 'flex-end',
//   },
//   iconButton: {
//     width: 40,
//     height: 40,
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderRadius: 20,
//     marginHorizontal: 4,
//   },
//   title: {
//     fontSize: 18,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   subtitle: {
//     fontSize: 12,
//     marginTop: 2,
//     textAlign: 'center',
//   },
//   badge: {
//     position: 'absolute',
//     top: 4,
//     right: 4,
//     backgroundColor: '#EF4444',
//     borderRadius: 10,
//     minWidth: 18,
//     height: 18,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 4,
//   },
//   badgeText: {
//     color: '#FFFFFF',
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
// });

// export default Header;